import { NestFactory } from '@nestjs/core';
import { OrderServiceModule } from './order-service.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

const PORT = parseInt(process.env.PORT!);
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrderServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: PORT,
      },
    },
  );

  console.log(`Order Service running on port ${PORT}`);
  await app.listen();
}
bootstrap();
