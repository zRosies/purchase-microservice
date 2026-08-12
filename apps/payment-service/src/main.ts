import { NestFactory } from '@nestjs/core';
import { PaymentServiceModule } from './payment-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(PaymentServiceModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: parseInt(process.env.PORT!),
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL!],
      queue: process.env.ORDERS_EVENTS_QUEUE,
      queueOptions: {
        durable: true,
      },
    },
  });

  console.log(
    `Payment Service running on RabbitMQ queue ${process.env.ORDERS_EVENTS_QUEUE}'}`,
  );

  await app.startAllMicroservices();
}

bootstrap();
