import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WorkflowStatus } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { OrderIntakeService } from '../orders/order-intake.service';
import { N8nCallbackDto } from './dto/n8n-callback.dto';
import { N8nCallbackStatusDto } from './dto/n8n-callback-status.dto';
import { N8nListOrdersDto } from './dto/n8n-list-orders.dto';
import { N8nUpdateStatusDto } from './dto/n8n-update-status.dto';
import { N8nOrdersService } from './n8n-orders.service';
import { N8nService } from './n8n.service';

@Controller('n8n')
export class N8nController {
  private readonly logger = new Logger(N8nController.name);

  constructor(
    private readonly n8nService: N8nService,
    private readonly n8nOrders: N8nOrdersService,
    private readonly orderIntake: OrderIntakeService,
  ) {}

  @Public()
  @Post('callback')
  async callback(
    @Headers('x-n8n-secret') secret: string | undefined,
    @Body() dto: N8nCallbackDto,
  ) {
    this.n8nService.verifyWebhookSecret(secret);
    const businessId = await this.n8nOrders.resolveScopedBusinessId({
      businessId: dto.businessId,
      phoneNumberId: dto.phoneNumberId,
    });

    const created = await this.orderIntake.createFromWhatsApp({
      businessId,
      customerPhone: dto.customerPhone,
      customerName: dto.customerName,
      items: dto.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      notes: dto.notes,
      waMessageId: dto.waMessageId,
      source: 'whatsapp-n8n',
    });

    if (dto.workflowExecutionId) {
      try {
        await this.n8nService.markExecution(
          dto.workflowExecutionId,
          WorkflowStatus.SUCCESS,
          { orderId: created.id },
        );
      } catch (error) {
        this.logger.warn(
          `WorkflowExecution tracking failed for ${dto.workflowExecutionId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    const order = await this.n8nOrders.getOrder(created.id);

    return {
      success: true,
      message: 'Order created from n8n callback',
      data: order,
      order,
    };
  }

  /**
   * n8n confirm/cancel flow — same URL as create callback, PATCH method.
   * Body: { orderId, status } e.g. CONFIRMED or CANCELLED.
   */
  @Public()
  @Patch('callback')
  async callbackUpdateStatus(
    @Headers('x-n8n-secret') secret: string | undefined,
    @Body() dto: N8nCallbackStatusDto,
  ) {
    this.n8nService.verifyWebhookSecret(secret);

    let scopeBusinessId: string | undefined;
    if (dto.phoneNumberId?.trim()) {
      scopeBusinessId = await this.n8nOrders.resolveScopedBusinessId({
        businessId: dto.businessId,
        phoneNumberId: dto.phoneNumberId,
      });
    } else if (dto.businessId?.trim()) {
      await this.n8nOrders.assertBusinessExists(dto.businessId);
      scopeBusinessId = dto.businessId;
    }

    const order = await this.n8nOrders.updateStatus(
      dto.orderId,
      dto.status,
      scopeBusinessId,
    );
    return {
      success: true,
      message: 'Order status updated successfully',
      data: order,
      order,
    };
  }

  @Public()
  @Get('orders/:orderId')
  async getOrder(
    @Headers('x-n8n-secret') secret: string | undefined,
    @Param('orderId') orderId: string,
  ) {
    this.n8nService.verifyWebhookSecret(secret);
    const order = await this.n8nOrders.getOrder(orderId);
    return {
      success: true,
      message: 'OK',
      data: order,
      order,
    };
  }

  @Public()
  @Patch('orders/:orderId/status')
  async updateStatus(
    @Headers('x-n8n-secret') secret: string | undefined,
    @Param('orderId') orderId: string,
    @Body() dto: N8nUpdateStatusDto,
  ) {
    this.n8nService.verifyWebhookSecret(secret);
    const order = await this.n8nOrders.updateStatus(orderId, dto.status);
    return {
      success: true,
      message: 'Order status updated',
      data: order,
      order,
    };
  }

  @Public()
  @Get('businesses/by-whatsapp-phone-id/:phoneNumberId')
  async getBusinessByWhatsAppPhoneId(
    @Headers('x-n8n-secret') secret: string | undefined,
    @Param('phoneNumberId') phoneNumberId: string,
  ) {
    this.n8nService.verifyWebhookSecret(secret);
    const data =
      await this.n8nOrders.findByWhatsAppPhoneNumberId(phoneNumberId);
    return {
      success: true,
      message: 'OK',
      data,
    };
  }

  @Public()
  @Get('businesses/:businessId/orders')
  async listBusinessOrders(
    @Headers('x-n8n-secret') secret: string | undefined,
    @Param('businessId') businessId: string,
    @Query() query: N8nListOrdersDto,
  ) {
    this.n8nService.verifyWebhookSecret(secret);
    const result = await this.n8nOrders.listBusinessOrders(businessId, query);
    return {
      success: true,
      message: 'OK',
      data: result,
      orders: result.items,
    };
  }
}
