import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

interface Order {
  productId: string;
  items: Orders[];
}

export class Orders {
  productId!: string;
  quantity!: number;
}

@Controller('orders')
export class OrdersController {
  @MessagePattern('create_order')
  createOrder(order: Order) {
    console.log('Hitting microservice Order');
    return { message: 'Order createed', order };
  }
}
