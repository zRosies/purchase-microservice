import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICE_CLIENTS } from './constants';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';

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
    ClientsModule.register([
      {
        name: MICROSERVICE_CLIENTS.USERS_SERVICE,
        transport: Transport.TCP,
        options: {
          port: parseInt(process.env.USERS_PORT!),
        },
      },
      {
        name: MICROSERVICE_CLIENTS.ORDERS_SERVICE,
        transport: Transport.TCP,
        options: {
          port: parseInt(process.env.ORDERS_PORT!),
        },
      },
      {
        name: MICROSERVICE_CLIENTS.PRODUCTS_SERVICE,
        transport: Transport.TCP,
        options: {
          port: parseInt(process.env.PRODUCTS_PORT!),
        },
      },
      {
        name: MICROSERVICE_CLIENTS.PAYMENTS_SERVICE,
        transport: Transport.TCP,
        options: {
          port: parseInt(process.env.PAYMENTS_PORT!),
        },
      },
    ]),
  ],
  exports: [ClientsModule],
  controllers: [],
  providers: [],
})
export class ApiGatewayModule {}
