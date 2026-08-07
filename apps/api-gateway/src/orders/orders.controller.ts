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
import { MICROSERVICE_CLIENTS } from '../constants';
import { ClientProxy } from '@nestjs/microservices';

@Controller('orders')
export class OrdersController {
  // constructor(private readonly ordersService: OrdersService) {}
  constructor(
    @Inject(MICROSERVICE_CLIENTS.ORDERS_SERVICE)
    private orderServiceClient: ClientProxy,
  ) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    console.log('hitting gateway');
    return this.orderServiceClient.send('create_order', createOrderDto);
  }

  // @Get()
  // findAll() {
  //   return this.ordersService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.ordersService.findOne(+id);
  // }

  // @Put(':id')
  // update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
  //   return this.ordersService.update(+id, updateOrderDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.ordersService.remove(+id);
  // }
}
