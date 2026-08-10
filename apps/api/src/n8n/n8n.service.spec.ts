import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { N8nService } from './n8n.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('N8nService', () => {
  let service: N8nService;
  const prisma = {
    workflowExecution: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'N8N_WEBHOOK_SECRET') return 'super-secret';
      return '';
    }),
    get: jest.fn((key: string, fallback?: string) => {
      if (key === 'N8N_BASE_URL') return 'http://localhost:5678';
      if (key === 'N8N_ORDER_WEBHOOK_PATH') return '/webhook/ennitant-order';
      if (key === 'N8N_TIMEOUT_MS') return '1000';
      if (key === 'N8N_MAX_RETRIES') return '1';
      return fallback;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.workflowExecution.create.mockResolvedValue({ id: 'exec-1' });
    prisma.workflowExecution.update.mockResolvedValue({});

    const moduleRef = await Test.createTestingModule({
      providers: [
        N8nService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = moduleRef.get(N8nService);
  });

  it('rejects invalid webhook secrets', () => {
    expect(() => service.verifyWebhookSecret('wrong')).toThrow(
      UnauthorizedException,
    );
  });

  it('accepts valid webhook secrets', () => {
    expect(() => service.verifyWebhookSecret('super-secret')).not.toThrow();
  });

  it('marks workflow failed after retries are exhausted', async () => {
    mockedAxios.post.mockRejectedValue(new Error('connection refused'));

    const result = await service.triggerWorkflow({
      businessId: 'b1',
      customerPhone: '15551234567',
      messageBody: '2 lattes please',
    });

    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('connection refused');
    expect(prisma.workflowExecution.update).toHaveBeenCalled();
  });
});
