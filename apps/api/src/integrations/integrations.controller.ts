import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { IntegrationsService } from './integrations.service';

class UpsertIntegrationDto {
  @IsString()
  type!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  list(@CurrentBusiness() businessId: string) {
    return this.integrationsService.list(businessId);
  }

  @Post()
  upsert(
    @CurrentBusiness() businessId: string,
    @Body() dto: UpsertIntegrationDto,
  ) {
    return this.integrationsService.upsert(businessId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentBusiness() businessId: string,
  ) {
    return this.integrationsService.remove(id, businessId);
  }
}
