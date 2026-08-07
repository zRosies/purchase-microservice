import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ApiGatewayModule } from './api-gateway.module';

const PORT = parseInt(process.env.PORT!);

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  // Ativa validação de DTOs baseada nos decoradores do class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  console.log(`API-GATEWAY running on port ${PORT}`);
  await app.listen(PORT);
}

bootstrap();
