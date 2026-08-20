import { NestFactory } from '@nestjs/core';
import { ProductsServiceModule } from './products-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductsServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL!],
        queue: 'products_service_rpc',
        queueOptions: {
          durable: true,
        },
      },
    },
  );
  console.log(
    'Products Service running (RMQ RPC queue: products_service_rpc)',
  );
  await app.listen();
}
bootstrap();