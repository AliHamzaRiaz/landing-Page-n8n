import { IsString, Matches } from 'class-validator';

export class ResendOtpDto {
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'Enter a valid phone number with country code',
  })
  phoneNumber!: string;
}
