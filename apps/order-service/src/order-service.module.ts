import { Module } from '@nestjs/common';
import { OrdersController } from './orders/orders.controller';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { MICROSERVICE_CLIENTS } from './constants';
import { OrdersService } from './orders/orders.service';

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
    ClientsModule.register([
      {
        name: MICROSERVICE_CLIENTS.PRODUCTS_SERVICE,
        transport: Transport.TCP,
        options: {
          port: parseInt(process.env.PRODUCTS_PORT!),
        },
      },
    ]),
    TypeOrmModule.forFeature([Order, OrderItem]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrderServiceModule {}
