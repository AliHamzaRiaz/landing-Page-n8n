import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { OrderIntakeService } from '../orders/order-intake.service';
import { N8nOrdersService } from './n8n-orders.service';
import { N8nController } from './n8n.controller';
import { N8nService } from './n8n.service';

describe('N8nController S2S auth', () => {
  let controller: N8nController;
  const n8nService = {
    verifyWebhookSecret: jest.fn(),
    markExecution: jest.fn(),
  };
  const n8nOrders = {
    assertBusinessExists: jest.fn(),
    getOrder: jest.fn(),
    updateStatus: jest.fn(),
    listBusinessOrders: jest.fn(),
  };
  const orderIntake = {
    createFromWhatsApp: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    n8nService.verifyWebhookSecret.mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({
      controllers: [N8nController],
      providers: [
        { provide: N8nService, useValue: n8nService },
        { provide: N8nOrdersService, useValue: n8nOrders },
        { provide: OrderIntakeService, useValue: orderIntake },
      ],
    }).compile();
    controller = moduleRef.get(N8nController);
  });

  it('rejects getOrder without valid secret', async () => {
    n8nService.verifyWebhookSecret.mockImplementation(() => {
      throw new UnauthorizedException('Invalid n8n webhook secret');
    });
    await expect(controller.getOrder(undefined, 'o1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns order contract on getOrder', async () => {
    n8nOrders.getOrder.mockResolvedValue({
      id: 'o1',
      orderNumber: 'ORD-00001',
      status: OrderStatus.PENDING,
    });
    const result = await controller.getOrder('secret', 'o1');
    expect(result.success).toBe(true);
    expect(result.order).toEqual(
      expect.objectContaining({ id: 'o1', orderNumber: 'ORD-00001' }),
    );
  });

  it('updates status through S2S route', async () => {
    n8nOrders.updateStatus.mockResolvedValue({
      id: 'o1',
      status: OrderStatus.CONFIRMED,
    });
    const result = await controller.updateStatus('secret', 'o1', {
      status: OrderStatus.CONFIRMED,
    });
    expect(result.order.status).toBe(OrderStatus.CONFIRMED);
    expect(n8nOrders.updateStatus).toHaveBeenCalledWith(
      'o1',
      OrderStatus.CONFIRMED,
    );
  });
});
