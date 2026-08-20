import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from './user-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL!],
        queue: 'user_service_rpc',
        queueOptions: {
          durable: true,
        },
      },
    },
  );
  console.log('User Service running (RMQ RPC queue: user_service_rpc)');
  await app.listen();
}
bootstrap();