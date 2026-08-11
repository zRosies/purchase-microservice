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

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  items?: OrderedItemPayload[];
}
