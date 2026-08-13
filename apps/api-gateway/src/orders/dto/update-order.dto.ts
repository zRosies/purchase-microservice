import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { OrderedItemPayload } from 'apps/products-service/src/products-service.controller';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    type: [Object],
    description: 'Order items (productId, quantity)',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  items?: OrderedItemPayload[];
}
