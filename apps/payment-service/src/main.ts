import { NestFactory } from '@nestjs/core';
import { PaymentServiceModule } from './payment-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(PaymentServiceModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL!],
      queue: 'payment_service_rpc',
      queueOptions: {
        durable: true,
      },
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL!],
      queue: process.env.ORDER_EVENTS_QUEUE!,
      queueOptions: {
        durable: true,
      },
    },
  });

  console.log(
    'Payment Service running (RMQ RPC queue: payment_service_rpc, RMQ events: order_events)',
  );

  await app.startAllMicroservices();
}

bootstrap();
