import { IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'Enter a valid phone number with country code',
  })
  phoneNumber!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(8)
  confirmPassword!: string;
}
