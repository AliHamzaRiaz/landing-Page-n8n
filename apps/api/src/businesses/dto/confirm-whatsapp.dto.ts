import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class ConfirmWhatsAppDto {
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code?: string;
}
