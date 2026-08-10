export type OtpChannel = 'sms' | 'whatsapp' | 'console';

export interface SendOtpInput {
  phoneNumber: string;
  code: string;
  purpose: 'signup' | 'whatsapp_verify' | 'login';
}

export interface OtpProvider {
  readonly name: string;
  readonly configured: boolean;
  send(input: SendOtpInput): Promise<{ channel: OtpChannel; delivered: boolean }>;
}
