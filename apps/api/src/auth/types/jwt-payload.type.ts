import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  businessId: string;
  phoneNumber: string;
  role: UserRole;
}
