import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import type { CreateOrderDto, UpdateOrderDto } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('create_order')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern('get_all_orders')
  findAll(
    @Payload()
    securityLevel: string,
  ) {
    return this.ordersService.findAll(securityLevel);
  }

  @MessagePattern('get_order')
  findOne(
    @Payload()
    data: {
      id: string;
      securityLevel: string;
      userId: string;
    },
  ) {
    return this.ordersService.findOne(data);
  }

  @MessagePattern('update_order')
  update(@Payload() payload: { id: string } & UpdateOrderDto) {
    const { id, ...updateOrderDto } = payload;
    return this.ordersService.update(id, updateOrderDto);
  }

  @MessagePattern('remove_order')
  remove(@Payload() id: string) {
    return this.ordersService.remove(id);
  }
}
