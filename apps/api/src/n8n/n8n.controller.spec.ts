import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OrderStatus, WorkflowStatus } from '@prisma/client';
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
    resolveScopedBusinessId: jest.fn(),
    getOrder: jest.fn(),
    updateStatus: jest.fn(),
    listBusinessOrders: jest.fn(),
    findByWhatsAppPhoneNumberId: jest.fn(),
  };
  const orderIntake = {
    createFromWhatsApp: jest.fn(),
  };

  const baseCallbackDto = {
    businessId: 'biz-1',
    customerPhone: '+923001234567',
    customerName: 'Test Customer',
    items: [{ name: 'Item A', quantity: 1, unitPrice: 100 }],
  };

  const createdOrder = {
    id: 'order-1',
    orderNumber: 'ORD-00001',
    status: OrderStatus.PENDING,
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    n8nService.verifyWebhookSecret.mockImplementation(() => undefined);
    n8nOrders.assertBusinessExists.mockResolvedValue(undefined);
    n8nOrders.resolveScopedBusinessId.mockImplementation(
      async (params: { businessId?: string }) => params.businessId ?? 'biz-1',
    );
    orderIntake.createFromWhatsApp.mockResolvedValue({ id: 'order-1' });
    n8nOrders.getOrder.mockResolvedValue(createdOrder);
    n8nService.markExecution.mockResolvedValue(null);

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

  it('confirms order via PATCH /n8n/callback', async () => {
    n8nOrders.updateStatus.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-00001',
      status: OrderStatus.CONFIRMED,
    });

    const result = await controller.callbackUpdateStatus('secret', {
      orderId: 'order-1',
      status: OrderStatus.CONFIRMED,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Order status updated successfully');
    expect(result.order.status).toBe(OrderStatus.CONFIRMED);
    expect(n8nOrders.updateStatus).toHaveBeenCalledWith(
      'order-1',
      OrderStatus.CONFIRMED,
      undefined,
    );
  });

  it('cancels order via PATCH /n8n/callback', async () => {
    n8nOrders.updateStatus.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.CANCELLED,
    });

    const result = await controller.callbackUpdateStatus('secret', {
      orderId: 'order-1',
      status: OrderStatus.CANCELLED,
    });

    expect(result.order.status).toBe(OrderStatus.CANCELLED);
    expect(n8nOrders.updateStatus).toHaveBeenCalledWith(
      'order-1',
      OrderStatus.CANCELLED,
      undefined,
    );
  });

  it('rejects PATCH /n8n/callback without valid secret', async () => {
    n8nService.verifyWebhookSecret.mockImplementation(() => {
      throw new UnauthorizedException('Invalid n8n webhook secret');
    });

    await expect(
      controller.callbackUpdateStatus(undefined, {
        orderId: 'order-1',
        status: OrderStatus.CONFIRMED,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(n8nOrders.updateStatus).not.toHaveBeenCalled();
  });

  it('creates order when workflowExecutionId exists locally', async () => {
    n8nService.markExecution.mockResolvedValue({
      id: 'exec-local',
      status: WorkflowStatus.SUCCESS,
    });

    const result = await controller.callback('secret', {
      ...baseCallbackDto,
      workflowExecutionId: 'exec-local',
    });

    expect(orderIntake.createFromWhatsApp).toHaveBeenCalled();
    expect(n8nService.markExecution).toHaveBeenCalledWith(
      'exec-local',
      WorkflowStatus.SUCCESS,
      { orderId: 'order-1' },
    );
    expect(result.success).toBe(true);
    expect(result.order).toEqual(
      expect.objectContaining({ id: 'order-1', orderNumber: 'ORD-00001' }),
    );
  });

  it('creates order when workflowExecutionId is missing', async () => {
    const result = await controller.callback('secret', { ...baseCallbackDto });

    expect(orderIntake.createFromWhatsApp).toHaveBeenCalled();
    expect(n8nService.markExecution).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.order).toEqual(expect.objectContaining({ id: 'order-1' }));
  });

  it('creates order when workflowExecutionId is unknown (n8n cloud id)', async () => {
    n8nService.markExecution.mockResolvedValue(null);

    const result = await controller.callback('secret', {
      ...baseCallbackDto,
      workflowExecutionId: 'n8n-cloud-exec-999',
    });

    expect(orderIntake.createFromWhatsApp).toHaveBeenCalled();
    expect(n8nService.markExecution).toHaveBeenCalledWith(
      'n8n-cloud-exec-999',
      WorkflowStatus.SUCCESS,
      { orderId: 'order-1' },
    );
    expect(result.success).toBe(true);
    expect(result.order).toEqual(expect.objectContaining({ id: 'order-1' }));
  });

  it('still creates order if markExecution throws', async () => {
    n8nService.markExecution.mockRejectedValue(
      new Error('No record was found for an update'),
    );

    const result = await controller.callback('secret', {
      ...baseCallbackDto,
      workflowExecutionId: 'broken-id',
    });

    expect(result.success).toBe(true);
    expect(result.order).toEqual(expect.objectContaining({ id: 'order-1' }));
  });

  it('rejects callback with invalid x-n8n-secret', async () => {
    n8nService.verifyWebhookSecret.mockImplementation(() => {
      throw new UnauthorizedException('Invalid n8n webhook secret');
    });

    await expect(
      controller.callback(undefined, { ...baseCallbackDto }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(orderIntake.createFromWhatsApp).not.toHaveBeenCalled();
  });

  it('rejects callback with invalid businessId', async () => {
    n8nOrders.resolveScopedBusinessId.mockRejectedValue(
      new NotFoundException('Business not found'),
    );

    await expect(
      controller.callback('secret', {
        ...baseCallbackDto,
        businessId: 'missing-biz',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(orderIntake.createFromWhatsApp).not.toHaveBeenCalled();
  });

  it('returns business for valid WhatsApp phone_number_id', async () => {
    n8nOrders.findByWhatsAppPhoneNumberId.mockResolvedValue({
      businessId: 'cmsn4guam0000v9w0n3npytin',
      companyName: 'ABC Garments',
      whatsappNumber: '+923134996633',
      phoneNumberId: '123456789',
    });

    const result = await controller.getBusinessByWhatsAppPhoneId(
      'secret',
      '123456789',
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      businessId: 'cmsn4guam0000v9w0n3npytin',
      companyName: 'ABC Garments',
      whatsappNumber: '+923134996633',
      phoneNumberId: '123456789',
    });
    expect(n8nOrders.findByWhatsAppPhoneNumberId).toHaveBeenCalledWith(
      '123456789',
    );
  });

  it('rejects by-whatsapp-phone-id lookup with invalid secret', async () => {
    n8nService.verifyWebhookSecret.mockImplementation(() => {
      throw new UnauthorizedException('Invalid n8n webhook secret');
    });

    await expect(
      controller.getBusinessByWhatsAppPhoneId(undefined, '123456789'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(n8nOrders.findByWhatsAppPhoneNumberId).not.toHaveBeenCalled();
  });

  it('returns 404 when WhatsApp phone_number_id is unknown', async () => {
    n8nOrders.findByWhatsAppPhoneNumberId.mockRejectedValue(
      new NotFoundException(
        'Business WhatsApp number is not connected to any business.',
      ),
    );

    await expect(
      controller.getBusinessByWhatsAppPhoneId('secret', 'unknown'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
