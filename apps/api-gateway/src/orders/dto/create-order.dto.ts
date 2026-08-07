import { Type } from 'class-transformer';
import {
  IsUUID,
  IsInt,
  Min,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  user_id!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderedItems)
  items!: OrderedItems[];
}

export class OrderedItems {
  @IsUUID()
  product_id!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
