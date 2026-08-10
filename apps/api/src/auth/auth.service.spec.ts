import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    business: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  const jwt = { signAsync: jest.fn().mockResolvedValue('test-token') };
  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return '';
    }),
    get: jest.fn((key: string, fallback?: string) => {
      if (key === 'JWT_EXPIRES_IN') return '7d';
      if (key === 'OTP_DEV_MODE') return 'true';
      return fallback;
    }),
  };
  const otpService = {
    send: jest.fn().mockResolvedValue({ channel: 'console', delivered: true }),
    isDevMode: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
        { provide: OtpService, useValue: otpService },
      ],
    }).compile();
    service = module.get(AuthService);
    prisma.business.findUnique.mockResolvedValue(null);
  });

  it('registers with phone and returns verification requirement', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
      fn({
        user: {
          findUnique: jest.fn(),
          update: jest.fn(),
          create: jest.fn().mockResolvedValue({
            id: 'u1',
            phoneNumber: '+923001234567',
            role: 'OWNER',
            businessId: 'b1',
            isVerified: false,
            firstName: null,
            lastName: null,
            email: null,
            createdAt: new Date(),
          }),
        },
        business: {
          findUnique: jest.fn(),
          create: jest.fn().mockResolvedValue({
            id: 'b1',
            name: 'My Business',
            slug: 'business-1234',
            onboardingCompleted: false,
          }),
        },
        auditLog: { create: jest.fn() },
        $transaction: jest.fn(),
      }),
    );
    prisma.user.update.mockResolvedValue({});

    const result = await service.register({
      phoneNumber: '+923001234567',
      password: 'Demo1234!',
      confirmPassword: 'Demo1234!',
    });

    expect(result.data.requiresVerification).toBe(true);
    expect(result.data.phoneNumber).toBe('+923001234567');
  });

  it('rejects duplicate phone registration', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(
      service.register({
        phoneNumber: '+923001234567',
        password: 'Demo1234!',
        confirmPassword: 'Demo1234!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects mismatched passwords', async () => {
    await expect(
      service.register({
        phoneNumber: '+923001234567',
        password: 'Demo1234!',
        confirmPassword: 'Other123!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid login', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ phoneNumber: '+923001234567', password: 'wrongpass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logs in verified user', async () => {
    const passwordHash = await argon2.hash('Demo1234!');
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      phoneNumber: '+923001234567',
      passwordHash,
      isVerified: true,
      role: 'OWNER',
      businessId: 'b1',
      firstName: 'Demo',
      lastName: 'Owner',
      email: null,
      createdAt: new Date(),
      business: {
        id: 'b1',
        name: 'Demo Cafe',
        companyName: 'Demo Cafe',
        slug: 'demo-cafe',
        phone: '+923001234567',
        whatsappNumber: '+923001234567',
        whatsappVerified: true,
        onboardingCompleted: true,
        currency: 'PKR',
      },
    });

    const result = await service.login({
      phoneNumber: '+923001234567',
      password: 'Demo1234!',
    });
    expect(result.data.accessToken).toBe('test-token');
  });
});
