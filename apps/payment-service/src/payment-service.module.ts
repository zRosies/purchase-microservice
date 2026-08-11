import { Module } from '@nestjs/common';
import { PaymentServiceController } from './payment-service.controller';
import { PaymentServiceService } from './payment-service.service';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/payment-service/.env'],
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          queue: 'payment_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [PaymentServiceController],
  providers: [PaymentServiceService],
})
export class PaymentServiceModule {}
