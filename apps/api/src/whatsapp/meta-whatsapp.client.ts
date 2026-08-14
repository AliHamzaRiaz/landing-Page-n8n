import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, isAxiosError } from 'axios';

export interface SendTextResult {
  messageId?: string;
  raw: unknown;
}

export interface TokenExchangeResult {
  accessToken: string;
  expiresIn?: number;
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
      timeout: 20000,
    });
  }

  async exchangeAuthorizationCode(code: string): Promise<TokenExchangeResult> {
    const appId = this.config.getOrThrow<string>('META_APP_ID');
    const appSecret = this.config.getOrThrow<string>('META_APP_SECRET');

    const response = await this.http.get<{
      access_token?: string;
      expires_in?: number;
    }>('/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        code: code.trim(),
      },
    });

    const accessToken = response.data?.access_token?.trim();
    if (!accessToken) {
      throw new Error('Meta did not return an access token');
    }

    return {
      accessToken,
      expiresIn: response.data.expires_in,
    };
  }

  async subscribeWaba(wabaId: string, accessToken: string): Promise<boolean> {
    try {
      const response = await this.http.post<{ success?: boolean }>(
        `/${wabaId.trim()}/subscribed_apps`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data?.success === true;
    } catch (error) {
      this.logger.warn(
        `WABA subscription failed for ${wabaId}: ${this.formatAxiosError(error)}`,
      );
      return false;
    }
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
        `WhatsApp credential validation failed: ${this.formatAxiosError(error)}`,
      );
      return { ok: false as const };
    }
  }

  private formatAxiosError(error: unknown): string {
    if (isAxiosError(error)) {
      return (
        (error.response?.data as { error?: { message?: string } })?.error
          ?.message || error.message
      );
    }
    return error instanceof Error ? error.message : 'unknown error';
  }
}
