import { NestFactory } from '@nestjs/core';
import { OrderServiceModule } from './order-service.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(OrderServiceModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL!],
      queue: 'order_service_rpc',
      queueOptions: {
        durable: true,
      },
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL!],
      queue: process.env.PAYMENT_EVENTS_QUEUE!,
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  console.log(
    'Order Service running (RMQ RPC queue: order_service_rpc, RMQ events: payment_events)',
  );
}

bootstrap();