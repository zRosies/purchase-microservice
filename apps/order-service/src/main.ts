import { NestFactory } from '@nestjs/core';
import { OrderServiceModule } from './order-service.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

const PORT = parseInt(process.env.PORT!);

async function bootstrap() {
  const app = await NestFactory.create(OrderServiceModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: PORT,
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
  console.log(`Order Service running (TCP port ${PORT}, RMQ listening)`);
}

bootstrap();
