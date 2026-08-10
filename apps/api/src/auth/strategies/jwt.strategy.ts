import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        phoneNumber: true,
        role: true,
        businessId: true,
        isVerified: true,
      },
    });

    if (
      !user ||
      user.businessId !== payload.businessId ||
      !user.isVerified
    ) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    return {
      sub: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
      businessId: user.businessId,
    };
  }
}
