import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, WorkflowStatus } from '@prisma/client';
import axios, { AxiosError } from 'axios';
import { createHash, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface TriggerWorkflowPayload {
  businessId: string;
  customerPhone: string;
  customerName?: string | null;
  messageBody: string;
  waMessageId?: string | null;
  products?: Array<{
    id: string;
    name: string;
    sku: string | null;
    price: number;
  }>;
}

@Injectable()
export class N8nService {
  private readonly logger = new Logger(N8nService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  verifyWebhookSecret(headerValue?: string): void {
    const expected = this.config.getOrThrow<string>('N8N_WEBHOOK_SECRET');
    if (!headerValue) {
      throw new UnauthorizedException('Missing n8n webhook secret');
    }

    const a = createHash('sha256').update(headerValue).digest();
    const b = createHash('sha256').update(expected).digest();
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid n8n webhook secret');
    }
  }

  async triggerWorkflow(payload: TriggerWorkflowPayload) {
    const timeoutMs = Number(this.config.get('N8N_TIMEOUT_MS') ?? 15000);
    const maxRetries = Number(this.config.get('N8N_MAX_RETRIES') ?? 2);
    const baseUrl = this.config.get<string>(
      'N8N_BASE_URL',
      'http://localhost:5678',
    );
    const path = this.config.get<string>(
      'N8N_ORDER_WEBHOOK_PATH',
      '/webhook/ennitant-order',
    );
    const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

    const execution = await this.prisma.workflowExecution.create({
      data: {
        businessId: payload.businessId,
        workflowName: 'order-extraction',
        status: WorkflowStatus.PENDING,
        input: payload as unknown as Prisma.InputJsonValue,
        attempts: 0,
      },
    });

    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: WorkflowStatus.RUNNING,
          attempts: attempt,
          startedAt: attempt === 1 ? new Date() : undefined,
        },
      });

      try {
        const response = await axios.post(
          url,
          {
            ...payload,
            workflowExecutionId: execution.id,
            callbackSecretHint: 'use x-n8n-secret header',
          },
          {
            timeout: timeoutMs,
            headers: {
              'Content-Type': 'application/json',
              'x-n8n-secret': this.config.getOrThrow<string>(
                'N8N_WEBHOOK_SECRET',
              ),
              ...(this.config.get('N8N_API_KEY')
                ? { 'X-N8N-API-KEY': this.config.get<string>('N8N_API_KEY') }
                : {}),
            },
          },
        );

        await this.prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: WorkflowStatus.SUCCESS,
            output: response.data as Prisma.InputJsonValue,
            finishedAt: new Date(),
            error: null,
          },
        });

        return { executionId: execution.id, status: WorkflowStatus.SUCCESS };
      } catch (error) {
        const axiosError = error as AxiosError;
        const timedOut =
          axiosError.code === 'ECONNABORTED' ||
          axiosError.message?.toLowerCase().includes('timeout');

        lastError = timedOut
          ? 'n8n workflow timed out'
          : axiosError.response?.data
            ? JSON.stringify(axiosError.response.data)
            : axiosError.message || 'n8n workflow failed';

        this.logger.warn(
          `n8n trigger attempt ${attempt} failed: ${lastError}`,
        );

        if (attempt > maxRetries) {
          await this.prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
              status: timedOut
                ? WorkflowStatus.TIMEOUT
                : WorkflowStatus.FAILED,
              error: lastError,
              finishedAt: new Date(),
            },
          });
          return {
            executionId: execution.id,
            status: timedOut
              ? WorkflowStatus.TIMEOUT
              : WorkflowStatus.FAILED,
            error: lastError,
          };
        }
      }
    }

    return {
      executionId: execution.id,
      status: WorkflowStatus.FAILED,
      error: lastError,
    };
  }

  /**
   * Marks a local Prisma WorkflowExecution only.
   * n8n Cloud execution IDs are not Prisma ids — missing records are skipped
   * without throwing so order callbacks keep succeeding.
   */
  async markExecution(
    id: string,
    status: WorkflowStatus,
    output?: unknown,
    error?: string,
  ) {
    const existing = await this.prisma.workflowExecution.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      this.logger.warn(
        `Skipping WorkflowExecution update; id is not a local record: ${id}`,
      );
      return null;
    }

    return this.prisma.workflowExecution.update({
      where: { id },
      data: {
        status,
        output: (output as Prisma.InputJsonValue) ?? undefined,
        error,
        finishedAt: new Date(),
      },
    });
  }
}
