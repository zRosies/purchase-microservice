import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Inject,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { MICROSERVICE_CLIENTS } from '../constants';
import { ClientProxy } from '@nestjs/microservices';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(MICROSERVICE_CLIENTS.ORDERS_SERVICE)
    private orderServiceClient: ClientProxy,
  ) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderServiceClient.send('create_order', createOrderDto);
  }

  @Get()
  findAll() {
    return this.orderServiceClient.send('get_all_orders', {});
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderServiceClient.send('get_order', id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderServiceClient.send('update_order', {
      id,
      ...updateOrderDto,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderServiceClient.send('remove_order', id);
  }
}
