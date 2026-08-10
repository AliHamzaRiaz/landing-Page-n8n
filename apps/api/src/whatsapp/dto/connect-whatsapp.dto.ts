import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConnectWhatsAppDto {
  @IsString()
  @MaxLength(64)
  phoneNumberId!: string;

  @IsString()
  @MaxLength(2048)
  accessToken!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  wabaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  displayPhoneNumber?: string;
}
