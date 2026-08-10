import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'Enter a valid phone number with country code',
  })
  phoneNumber!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  code!: string;
}
