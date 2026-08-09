import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ApiGatewayModule } from './api-gateway.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { SecurityLevelGuard } from './auth/security-level.guard';
import { Reflector } from '@nestjs/core';

const PORT = parseInt(process.env.PORT!);

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  // Activate  DTO validation based on decorators from class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global authentication + role-based access control
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new SecurityLevelGuard(reflector),
  );

  console.log(`API-GATEWAY running on port ${PORT}`);
  await app.listen(PORT);
}

bootstrap();
