import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomInt } from 'crypto';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { ConfirmWhatsAppDto } from './dto/confirm-whatsapp.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  private normalizePhone(phone: string) {
    const digits = phone.replace(/[^\d+]/g, '');
    if (digits.startsWith('+')) return `+${digits.slice(1).replace(/\D/g, '')}`;
    return `+${digits.replace(/\D/g, '')}`;
  }

  private present(business: {
    id: string;
    name: string;
    companyName: string | null;
    slug: string;
    phone: string | null;
    whatsappNumber: string | null;
    whatsappVerified: boolean;
    onboardingCompleted: boolean;
    currency: string;
    email?: string | null;
    address?: string | null;
    timezone?: string | null;
    ownerName?: string | null;
    industry?: string | null;
  }) {
    return {
      id: business.id,
      name: business.companyName || business.name,
      companyName: business.companyName || business.name,
      slug: business.slug,
      phone: business.phone,
      whatsappNumber: business.whatsappNumber,
      whatsappVerified: business.whatsappVerified,
      onboardingCompleted: business.onboardingCompleted,
      currency: business.currency,
      email: business.email ?? null,
      address: business.address ?? null,
      timezone: business.timezone ?? null,
      ownerName: business.ownerName ?? null,
      industry: business.industry ?? null,
    };
  }

  async getMe(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    return { data: this.present(business) };
  }

  async completeOnboarding(
    businessId: string,
    userId: string,
    dto: OnboardingDto,
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { users: { where: { id: userId }, take: 1 } },
    });
    if (!business) throw new NotFoundException('Business not found');

    const companyName = dto.companyName.trim();
    const userPhone = business.users[0]?.phoneNumber;
    const whatsappNumber = this.normalizePhone(
      dto.whatsappNumber || business.whatsappNumber || userPhone || '',
    );
    if (!whatsappNumber) {
      throw new BadRequestException('WhatsApp number is required');
    }

    const sameAsSignup = userPhone
      ? this.normalizePhone(userPhone) === whatsappNumber
      : true;

    let requiresWhatsAppOtp = false;
    let devCode: string | undefined;

    if (!sameAsSignup) {
      requiresWhatsAppOtp = true;
      const code = String(randomInt(100000, 999999));
      const otpHash = await argon2.hash(code);
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          otpHash,
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
          otpAttempts: 0,
        },
      });
      await this.otpService.send({
        phoneNumber: whatsappNumber,
        code,
        purpose: 'whatsapp_verify',
      });
      if (this.otpService.isDevMode()) devCode = code;
    }

    const slug = await this.ensureSlug(businessId, companyName, business.slug);

    const updated = await this.prisma.business.update({
      where: { id: businessId },
      data: {
        name: companyName,
        companyName,
        slug,
        whatsappNumber,
        phone: whatsappNumber,
        whatsappVerified: sameAsSignup ? true : false,
        onboardingCompleted: sameAsSignup,
      },
    });

    if (sameAsSignup) {
      await this.whatsapp
        .attachPlatformCredentials(businessId, whatsappNumber)
        .catch(() => undefined);
    }

    return {
      message: sameAsSignup
        ? 'Business setup complete'
        : 'Please verify your WhatsApp number',
      data: {
        ...this.present(updated),
        requiresWhatsAppOtp,
        ...(devCode ? { devCode } : {}),
      },
    };
  }

  async confirmWhatsApp(
    businessId: string,
    userId: string,
    dto: ConfirmWhatsAppDto,
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const whatsappNumber = this.normalizePhone(
      dto.whatsappNumber || business.whatsappNumber || user.phoneNumber,
    );

    if (dto.code) {
      if (!user.otpHash || !user.otpExpiresAt) {
        throw new BadRequestException('No verification code found');
      }
      if (user.otpExpiresAt.getTime() < Date.now()) {
        throw new BadRequestException('Code expired. Please try again.');
      }
      const valid = await argon2.verify(user.otpHash, dto.code);
      if (!valid) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { otpAttempts: { increment: 1 } },
        });
        throw new BadRequestException('Invalid verification code');
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 },
      });
    }

    const updated = await this.prisma.business.update({
      where: { id: businessId },
      data: {
        whatsappNumber,
        phone: whatsappNumber,
        whatsappVerified: true,
        onboardingCompleted: true,
      },
    });

    await this.whatsapp
      .attachPlatformCredentials(businessId, whatsappNumber)
      .catch(() => undefined);

    return {
      message: 'WhatsApp connected successfully',
      data: this.present(updated),
    };
  }

  async updateMe(businessId: string, dto: UpdateBusinessDto) {
    const existing = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!existing) throw new NotFoundException('Business not found');

    const name = dto.name?.trim();
    const nullable = (value?: string) => {
      if (value === undefined) return undefined;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    };
    const timezone =
      dto.timezone === undefined
        ? undefined
        : dto.timezone.trim() || existing.timezone || 'UTC';

    const business = await this.prisma.business.update({
      where: { id: businessId },
      data: {
        ...(name ? { name, companyName: name } : {}),
        ownerName: nullable(dto.ownerName),
        email: nullable(dto.email),
        industry: nullable(dto.industry),
        timezone,
        currency: dto.currency?.trim() || undefined,
        phone: nullable(dto.phone),
        address: nullable(dto.address),
        onboardingCompleted: dto.onboardingCompleted,
      },
    });

    return { message: 'Business updated', data: this.present(business) };
  }

  private async ensureSlug(
    businessId: string,
    companyName: string,
    currentSlug: string,
  ) {
    const base =
      companyName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || currentSlug;

    if (base === currentSlug) return currentSlug;

    let slug = base;
    let i = 1;
    while (true) {
      const found = await this.prisma.business.findUnique({ where: { slug } });
      if (!found || found.id === businessId) return slug;
      slug = `${base}-${i++}`;
    }
  }
}
