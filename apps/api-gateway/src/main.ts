import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiGatewayModule } from './api-gateway.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { SecurityLevelGuard } from './auth/security-level.guard';
import { Reflector } from '@nestjs/core';

const PORT = parseInt(process.env.PORT!);

async function bootstrap() {
  // rawBody: true exposes the raw request body (req.rawBody) for Stripe webhook verification
  const app = await NestFactory.create(ApiGatewayModule, {
    rawBody: true,
  });

  // Activate DTO validation based on decorators from class-validator
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

  // Swagger / OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Ecommerce API Gateway')
    .setDescription('REST API for the ecommerce microservices monorepo')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  console.log(`API-GATEWAY running on port ${PORT}`);
  await app.listen(PORT);
}

bootstrap();
