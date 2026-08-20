import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICE_CLIENTS } from './constants';
import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/api-gateway/.env'],
      isGlobal: true,
    }),
    OrdersModule,
    PaymentsModule,
    AuthModule,
    ProductsModule,
    ClientsModule.register([
      {
        name: MICROSERVICE_CLIENTS.USERS_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: 'user_service_rpc',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: MICROSERVICE_CLIENTS.ORDERS_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: 'order_service_rpc',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: MICROSERVICE_CLIENTS.PRODUCTS_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: 'products_service_rpc',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: MICROSERVICE_CLIENTS.PAYMENTS_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: 'payment_service_rpc',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule],
  controllers: [],
  providers: [],
})
export class ApiGatewayModule {}
