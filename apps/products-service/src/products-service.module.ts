import { Module } from '@nestjs/common';
import { ProductsServiceController } from './products-service.controller';
import { ProductsService } from './products-service.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/products-category.entity';
import { Product } from './entities/products.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/products-service/.env'],
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
<<<<<<< HEAD
      host: process.env.DB_HOST || 'localhost',
=======
      host: process.env.DB_HOST ?? 'localhost',
>>>>>>> 7c9ff8f6e6cdb5423b9635465c9831fc643329c2
      port: parseInt(process.env.SERVER_PORT!),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      entities: [Category, Product],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Product]),
  ],
  controllers: [ProductsServiceController],
  providers: [ProductsService],
})
export class ProductsServiceModule {}
