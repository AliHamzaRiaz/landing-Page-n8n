import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomInt } from 'crypto';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  normalizePhone(phone: string) {
    let digits = phone.replace(/\D/g, '');
    // Common mistake: country code + trunk 0 (e.g. 92 + 0313... → 920313...).
    // E.164 national numbers must not keep the leading 0.
    if (digits.startsWith('92') && digits.length > 3 && digits[2] === '0') {
      digits = `92${digits.slice(3)}`;
    }
    return `+${digits}`;
  }

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const phoneNumber = this.normalizePhone(dto.phoneNumber);
    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });
    if (existing) {
      throw new ConflictException(
        'An account with this phone number already exists',
      );
    }

    const passwordHash = await argon2.hash(dto.password);
    const slug = await this.uniqueSlug(`business-${phoneNumber.slice(-4)}`);

    const result = await this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: 'My Business',
          companyName: 'My Business',
          slug,
          phone: phoneNumber,
          whatsappNumber: phoneNumber,
        },
      });

      const user = await tx.user.create({
        data: {
          phoneNumber,
          passwordHash,
          role: UserRole.OWNER,
          isVerified: false,
          businessId: business.id,
        },
      });

      await tx.auditLog.create({
        data: {
          businessId: business.id,
          userId: user.id,
          action: 'auth.register',
          entity: 'User',
          entityId: user.id,
        },
      });

      return { user, business };
    });

    const otpPayload = await this.issueOtp(result.user.id, phoneNumber);

    return {
      message: 'Account created. Please verify your phone number.',
      data: {
        phoneNumber,
        requiresVerification: true,
        ...(otpPayload.devCode ? { devCode: otpPayload.devCode } : {}),
      },
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const phoneNumber = this.normalizePhone(dto.phoneNumber);
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
      include: { business: true },
    });

    if (!user || !user.otpHash || !user.otpExpiresAt) {
      throw new BadRequestException('No verification code found. Please resend.');
    }

    if (user.otpAttempts >= 5) {
      throw new BadRequestException(
        'Too many attempts. Please request a new code.',
      );
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Code expired. Please request a new one.');
    }

    const valid = await argon2.verify(user.otpHash, dto.code);
    if (!valid) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid verification code');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
      },
      include: { business: true },
    });

    const tokens = await this.signTokens({
      sub: updated.id,
      businessId: updated.businessId,
      phoneNumber: updated.phoneNumber,
      role: updated.role,
    });

    return {
      message: 'Phone verified successfully',
      data: {
        accessToken: tokens.accessToken,
        user: this.sanitizeUser(updated),
        business: this.sanitizeBusiness(updated.business),
      },
    };
  }

  async resendOtp(dto: ResendOtpDto) {
    const phoneNumber = this.normalizePhone(dto.phoneNumber);
    const user = await this.prisma.user.findUnique({ where: { phoneNumber } });
    if (!user) {
      return {
        message: 'If an account exists, a new code has been sent',
        data: null,
      };
    }

    if (user.isVerified) {
      throw new BadRequestException('This number is already verified');
    }

    const otpPayload = await this.issueOtp(user.id, phoneNumber);
    return {
      message: 'A new verification code has been sent',
      data: {
        phoneNumber,
        ...(otpPayload.devCode ? { devCode: otpPayload.devCode } : {}),
      },
    };
  }

  async login(dto: LoginDto) {
    const phoneNumber = this.normalizePhone(dto.phoneNumber);
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
      include: { business: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    if (!user.isVerified) {
      const otpPayload = await this.issueOtp(user.id, phoneNumber);
      throw new UnauthorizedException({
        message: 'Please verify your phone number first',
        code: 'PHONE_NOT_VERIFIED',
        phoneNumber,
        ...(otpPayload.devCode ? { devCode: otpPayload.devCode } : {}),
      });
    }

    const tokens = await this.signTokens({
      sub: user.id,
      businessId: user.businessId,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });

    return {
      message: 'Logged in successfully',
      data: {
        accessToken: tokens.accessToken,
        user: this.sanitizeUser(user),
        business: this.sanitizeBusiness(user.business),
      },
    };
  }

  logout() {
    return { message: 'Logged out successfully', data: null };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      data: {
        user: this.sanitizeUser(user),
        business: this.sanitizeBusiness(user.business),
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const generic = {
      message: 'If that email is registered, reset instructions are on the way.',
      data: null,
    };
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { business: { email } }],
      },
    });
    if (!user) return generic;

    const token = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: this.hashToken(token),
        resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const frontend = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173').replace(
      /\/+$/,
      '',
    );
    if (this.config.get('OTP_DEV_MODE') === 'true') {
      this.logger.log(`Password reset link: ${frontend}/reset-password?token=${token}`);
    }
    return generic;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hash = this.hashToken(dto.token);
    const user = await this.prisma.user.findFirst({
      where: { resetTokenHash: hash, resetTokenExpiresAt: { gt: new Date() } },
    });
    if (!user) {
      throw new BadRequestException('Reset token is invalid or expired.');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await argon2.hash(dto.password),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });
    return { message: 'Password updated', data: null };
  }

  private async issueOtp(userId: string, phoneNumber: string) {
    const code = String(randomInt(100000, 999999));
    const otpHash = await argon2.hash(code);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: { otpHash, otpExpiresAt, otpAttempts: 0 },
    });

    await this.otpService.send({
      phoneNumber,
      code,
      purpose: 'signup',
    });

    return {
      code,
      devCode: this.otpService.isDevMode() ? code : undefined,
    };
  }

  private async signTokens(payload: JwtPayload) {
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '7d') as
      | number
      | `${number}d`
      | `${number}h`
      | `${number}m`
      | `${number}s`;
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn,
    });
    return { accessToken };
  }

  private sanitizeUser(user: {
    id: string;
    phoneNumber: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    role: UserRole;
    businessId: string;
    isVerified: boolean;
    createdAt: Date;
  }) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      name: name || user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      businessId: user.businessId,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }

  private sanitizeBusiness(business: {
    id: string;
    name: string;
    companyName: string | null;
    slug: string;
    phone: string | null;
    whatsappNumber: string | null;
    whatsappVerified: boolean;
    onboardingCompleted: boolean;
    currency: string;
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
    };
  }

  private async uniqueSlug(name: string) {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'business';

    let slug = base;
    let i = 1;
    while (await this.prisma.business.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }

  // Kept for optional password reset later via phone
  hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
