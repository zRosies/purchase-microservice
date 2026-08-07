import { Module } from '@nestjs/common';
import { OrderServiceService } from './order-service.service';
import { OrdersController } from './orders/orders.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/order-service/.env'],
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: parseInt(process.env.SERVER_PORT!),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      entities: [Order, OrderItem],
      synchronize: true,
    }),
  ],
  controllers: [OrdersController],
  providers: [OrderServiceService],
})
export class OrderServiceModule {}
