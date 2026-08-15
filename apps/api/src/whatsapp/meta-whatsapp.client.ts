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

export interface WabaPhoneNumber {
  id: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
}

export interface PhoneRegistration {
  ok: true;
  displayPhoneNumber?: string;
  verifiedName?: string;
  isOnBizApp?: boolean;
  platformType?: string;
}

export class MetaApiError extends Error {
  constructor(
    public readonly kind:
      | 'timeout'
      | 'auth'
      | 'not_found'
      | 'unknown',
    message: string,
  ) {
    super(message);
    this.name = 'MetaApiError';
  }
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

    try {
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
        throw new MetaApiError('auth', 'Meta did not return an access token');
      }

      return {
        accessToken,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      throw this.toMetaError(error, 'authorization');
    }
  }

  async getWaba(wabaId: string, accessToken: string) {
    try {
      const response = await this.http.get(`/${wabaId.trim()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { fields: 'id,name' },
      });
      if (!response.data?.id) {
        throw new MetaApiError('not_found', 'WABA not found');
      }
      return {
        id: String(response.data.id),
        name: response.data.name as string | undefined,
      };
    } catch (error) {
      throw this.toMetaError(error, 'waba');
    }
  }

  async listWabaPhoneNumbers(
    wabaId: string,
    accessToken: string,
  ): Promise<WabaPhoneNumber[]> {
    try {
      const response = await this.http.get(`/${wabaId.trim()}/phone_numbers`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { fields: 'id,display_phone_number,verified_name' },
      });
      const data = (response.data?.data ?? []) as Array<{
        id?: string;
        display_phone_number?: string;
        verified_name?: string;
      }>;
      return data
        .filter((row) => row.id)
        .map((row) => ({
          id: String(row.id),
          displayPhoneNumber: row.display_phone_number,
          verifiedName: row.verified_name,
        }));
    } catch (error) {
      throw this.toMetaError(error, 'waba phones');
    }
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
      if (this.isTimeout(error)) {
        throw new MetaApiError('timeout', 'Meta webhook subscription timed out');
      }
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
  }): Promise<PhoneRegistration | { ok: false }> {
    try {
      const response = await this.http.get(`/${params.phoneNumberId}`, {
        headers: { Authorization: `Bearer ${params.accessToken}` },
        params: {
          fields:
            'id,display_phone_number,verified_name,is_on_biz_app,platform_type',
        },
      });
      return {
        ok: true as const,
        displayPhoneNumber: response.data?.display_phone_number as
          | string
          | undefined,
        verifiedName: response.data?.verified_name as string | undefined,
        isOnBizApp:
          typeof response.data?.is_on_biz_app === 'boolean'
            ? response.data.is_on_biz_app
            : undefined,
        platformType: response.data?.platform_type as string | undefined,
      };
    } catch (error) {
      if (this.isTimeout(error)) {
        throw new MetaApiError('timeout', 'Meta phone validation timed out');
      }
      this.logger.warn(
        `WhatsApp credential validation failed: ${this.formatAxiosError(error)}`,
      );
      return { ok: false as const };
    }
  }

  private isTimeout(error: unknown): boolean {
    return isAxiosError(error) && error.code === 'ECONNABORTED';
  }

  private toMetaError(error: unknown, context: string): MetaApiError {
    if (error instanceof MetaApiError) return error;
    if (this.isTimeout(error)) {
      return new MetaApiError('timeout', `Meta ${context} timed out`);
    }
    const status = isAxiosError(error) ? error.response?.status : undefined;
    if (status === 404) {
      return new MetaApiError('not_found', `Meta ${context} was not found`);
    }
    if (status === 401 || status === 403) {
      return new MetaApiError('auth', `Meta ${context} was unauthorized`);
    }
    return new MetaApiError(
      'unknown',
      `Meta ${context} failed: ${this.formatAxiosError(error)}`,
    );
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
