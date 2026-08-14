import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class N8nOrderItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}

export class N8nCallbackDto {
  @IsString()
  businessId!: string;

  @IsOptional()
  @IsString()
  phoneNumberId?: string;

  @IsString()
  customerPhone!: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  workflowExecutionId?: string;

  @IsOptional()
  @IsString()
  waMessageId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => N8nOrderItemDto)
  items!: N8nOrderItemDto[];
}
