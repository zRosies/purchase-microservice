import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Interface } from 'readline/promises';

interface Order {
  product_id: string;
  items: Orders[];
}

export class Orders {
  product_id!: string;
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
