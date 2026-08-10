import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WorkflowStatus } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { OrderIntakeService } from '../orders/order-intake.service';
import { N8nCallbackDto } from './dto/n8n-callback.dto';
import { N8nListOrdersDto } from './dto/n8n-list-orders.dto';
import { N8nUpdateStatusDto } from './dto/n8n-update-status.dto';
import { N8nOrdersService } from './n8n-orders.service';
import { N8nService } from './n8n.service';

@Controller('n8n')
export class N8nController {
  constructor(
    private readonly n8nService: N8nService,
    private readonly n8nOrders: N8nOrdersService,
    private readonly orderIntake: OrderIntakeService,
  ) {}

  /**
   * Existing create-order callback used by n8n.
   * Business is identified by dto.businessId (set by Nest when triggering n8n
   * after webhook lookup by Meta phone_number_id). Kept compatible.
   */
  @Public()
  @Post('callback')
  async callback(
    @Headers('x-n8n-secret') secret: string | undefined,
    @Body() dto: N8nCallbackDto,
  ) {
    this.n8nService.verifyWebhookSecret(secret);
    await this.n8nOrders.assertBusinessExists(dto.businessId);

    const created = await this.orderIntake.createFromWhatsApp({
      businessId: dto.businessId,
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
      await this.n8nService.markExecution(
        dto.workflowExecutionId,
        WorkflowStatus.SUCCESS,
        { orderId: created.id },
      );
    }

    const order = await this.n8nOrders.getOrder(created.id);

    return {
      success: true,
      message: 'Order created from n8n callback',
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
