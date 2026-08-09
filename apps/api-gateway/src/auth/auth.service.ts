import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { MICROSERVICE_CLIENTS } from '../constants';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    securityLevel: string;
    role?: string | null;
    profile?: unknown;
  };
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(MICROSERVICE_CLIENTS.USERS_SERVICE)
    private readonly usersClient: ClientProxy,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    // Forward the DTO to the user-service message handler
    const result = await lastValueFrom(
      this.usersClient.send<AuthResult>('register', registerDto),
    );
    return result;
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const result = await lastValueFrom(
      this.usersClient.send<AuthResult>('login', loginDto),
    );
    return result;
  }
}
