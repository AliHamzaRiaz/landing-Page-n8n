import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { WorkflowStatus } from '@prisma/client';
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
      findUnique: jest.fn(),
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
    prisma.workflowExecution.findUnique.mockResolvedValue(null);

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
      phoneNumberId: 'phone-1',
      customerPhone: '15551234567',
      messageBody: '2 lattes please',
    });

    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('connection refused');
    expect(prisma.workflowExecution.update).toHaveBeenCalled();
  });

  it('updates WorkflowExecution when local id exists', async () => {
    prisma.workflowExecution.findUnique.mockResolvedValue({ id: 'exec-local' });
    prisma.workflowExecution.update.mockResolvedValue({
      id: 'exec-local',
      status: WorkflowStatus.SUCCESS,
    });

    const result = await service.markExecution(
      'exec-local',
      WorkflowStatus.SUCCESS,
      { orderId: 'o1' },
    );

    expect(result).toEqual(
      expect.objectContaining({ id: 'exec-local', status: WorkflowStatus.SUCCESS }),
    );
    expect(prisma.workflowExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'exec-local' },
        data: expect.objectContaining({ status: WorkflowStatus.SUCCESS }),
      }),
    );
  });

  it('skips update and does not throw for unknown workflowExecutionId', async () => {
    prisma.workflowExecution.findUnique.mockResolvedValue(null);

    await expect(
      service.markExecution('n8n-cloud-exec-999', WorkflowStatus.SUCCESS, {
        orderId: 'o1',
      }),
    ).resolves.toBeNull();

    expect(prisma.workflowExecution.update).not.toHaveBeenCalled();
  });
});
