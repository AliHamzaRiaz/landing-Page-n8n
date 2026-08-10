import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class OnboardingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  companyName!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'Enter a valid WhatsApp number with country code',
  })
  whatsappNumber?: string;
}
