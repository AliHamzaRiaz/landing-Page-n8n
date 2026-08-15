import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class EmbeddedSignupCompleteDto {
  /** OAuth authorization code from FB.login (response_type=code). */
  @IsString()
  @MinLength(1)
  code!: string;

  /** WhatsApp Business Account ID from WA_EMBEDDED_SIGNUP session event. */
  @IsString()
  @MinLength(1)
  wabaId!: string;

  /**
   * Meta phone_number_id from session event when Meta provides it.
   * Coexistence FINISH events may omit it; backend then loads phones from the WABA.
   */
  @IsOptional()
  @IsString()
  phoneNumberId?: string;

  @IsOptional()
  @IsString()
  displayPhoneNumber?: string;

  @IsOptional()
  @IsIn(['embedded_signup', 'coexistence'])
  onboardingPath?: 'embedded_signup' | 'coexistence';
}
