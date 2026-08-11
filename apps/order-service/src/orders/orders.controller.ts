import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import type {
  CreateOrderDto,
  orderUpdate,
  UpdateOrderDto,
} from './orders.service';

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
    data: orderUpdate,
  ) {
    return this.ordersService.findOrder(data);
  }

  @MessagePattern('update_order')
  update(
    @Payload()
    payload: orderUpdate extends { UpdateOrderDto: UpdateOrderDto }
      ? UpdateOrderDto
      : never,
  ) {
    return this.ordersService.update(payload);
  }

  @MessagePattern('remove_order')
  remove(@Payload() payload: orderUpdate) {
    return this.ordersService.cancel(payload);
  }

  @EventPattern('payment_succeeded')
  async handlePaymentSucceeded(@Payload() orderId: string) {
    return this.ordersService.paymentSucceeded(orderId);
  }

  @EventPattern('payment_failed')
  async handlePaymentFailed(@Payload() orderId: string) {
    return this.ordersService.paymentFailed(orderId);
  }
}
