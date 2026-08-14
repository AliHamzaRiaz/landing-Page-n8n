import { IsOptional, IsString, MinLength } from 'class-validator';

export class EmbeddedSignupCompleteDto {
  /** OAuth authorization code from FB.login (response_type=code). */
  @IsString()
  @MinLength(1)
  code!: string;

  /** WhatsApp Business Account ID from WA_EMBEDDED_SIGNUP session event. */
  @IsString()
  @MinLength(1)
  wabaId!: string;

  /** Meta phone_number_id from WA_EMBEDDED_SIGNUP session event. */
  @IsString()
  @MinLength(1)
  phoneNumberId!: string;

  @IsOptional()
  @IsString()
  displayPhoneNumber?: string;
}
