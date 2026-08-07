import { Module } from '@nestjs/common';
import { OrderServiceService } from './order-service.service';
import { OrdersController } from './orders/orders.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/order-service/.env'],
      isGlobal: true,
    }),
  ],
  controllers: [OrdersController],
  providers: [OrderServiceService],
})
export class OrderServiceModule {}
