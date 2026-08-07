import { NestFactory } from '@nestjs/core';
import { PaymentServiceModule } from './payment-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

const PORT = parseInt(process.env.PORT!);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: PORT,
      },
    },
  );
  console.log(`Payment Service running on port ${PORT}`);
  await app.listen();
}
bootstrap();
