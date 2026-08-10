import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface SendTextResult {
  messageId?: string;
  raw: unknown;
}

@Injectable()
export class MetaWhatsAppClient {
  private readonly logger = new Logger(MetaWhatsAppClient.name);
  private readonly http: AxiosInstance;
  private readonly version: string;

  constructor(private readonly config: ConfigService) {
    this.version = this.config.get<string>('META_GRAPH_API_VERSION', 'v21.0');
    this.http = axios.create({
      baseURL: `https://graph.facebook.com/${this.version}`,
      timeout: 15000,
    });
  }

  async sendTextMessage(params: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    body: string;
  }): Promise<SendTextResult> {
    const { phoneNumberId, accessToken, to, body } = params;
    const response = await this.http.post(
      `/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''),
        type: 'text',
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const messageId = response.data?.messages?.[0]?.id as string | undefined;
    return { messageId, raw: response.data };
  }

  async validateCredentials(params: {
    phoneNumberId: string;
    accessToken: string;
  }) {
    try {
      const response = await this.http.get(`/${params.phoneNumberId}`, {
        headers: { Authorization: `Bearer ${params.accessToken}` },
        params: { fields: 'id,display_phone_number,verified_name' },
      });
      return {
        ok: true as const,
        displayPhoneNumber: response.data?.display_phone_number as
          | string
          | undefined,
        verifiedName: response.data?.verified_name as string | undefined,
      };
    } catch (error) {
      this.logger.warn(
        `WhatsApp credential validation failed: ${
          axios.isAxiosError(error)
            ? error.response?.data?.error?.message || error.message
            : 'unknown error'
        }`,
      );
      return { ok: false as const };
    }
  }
}
