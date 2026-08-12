import { Module } from '@nestjs/common';
import { PaymentServiceController } from './payment-service.controller';
import { PaymentServiceService } from './payment-service.service';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { StripePaymentProvider } from './providers/stripePaymentProviders';
import { MICROSERVICE_CLIENTS } from './constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/payment-service/.env'],
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: MICROSERVICE_CLIENTS.PAYMENT_EVENTS,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: process.env.PAYMENT_EVENTS_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: MICROSERVICE_CLIENTS.ORDER_SERVICE,
        transport: Transport.TCP,
        options: {
          port: parseInt(process.env.ORDERS_PORT!),
        },
      },
    ]),
  ],
  controllers: [PaymentServiceController],
  providers: [PaymentServiceService, StripePaymentProvider],
})
export class PaymentServiceModule {}
