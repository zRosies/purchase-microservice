import { Module } from '@nestjs/common';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { Profile } from './users/entities/profile.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/user-service/.env'],
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
      entities: [User, Profile],
      synchronize: true,
    }),
    UsersModule,
  ],
  controllers: [UserServiceController],
  providers: [UserServiceService],
})
export class UserServiceModule {}
