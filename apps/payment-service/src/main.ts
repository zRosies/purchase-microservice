import { NestFactory } from '@nestjs/core';
import { PaymentServiceModule } from './payment-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

const PORT = parseInt(process.env.PORT!);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://guest:guest@localhost:5672'],
        queue: 'payment_queue',
        queueOptions: {
          durable: true,
        },
      },
    },
  );
  console.log(`Payment Service running on port ${PORT}`);
  await app.listen();
}
bootstrap();
