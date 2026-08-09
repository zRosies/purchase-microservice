import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, SecurityLevel } from './entities/user.entity';
import { Profile } from './entities/profile.entity';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  securityLevel?: SecurityLevel;
  profile?: {
    phone?: string;
    role?: string;
    address?: string;
    avatar?: string;
  };
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly jwtService: JwtService,
  ) {}

  // ---- Internal helpers ----

  private async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { profile: true },
    });

    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: `User with id ${id} not found`,
      });
    }

    return user;
  }

  private async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: { profile: true },
    });
  }

  private stripPasswordHash(user: User) {
    const { passwordHash, ...safeUser } = user;
    void passwordHash;
    return safeUser;
  }

  private signToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      securityLevel: user.securityLevel,
      role: user.profile?.role ?? null,
    };

    return this.jwtService.sign(payload);
  }

  // ---- Auth message handlers ----

  async register(
    createUserDto: CreateUserDto,
  ): Promise<{ user: Partial<User>; accessToken: string }> {
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) {
      throw new RpcException({
        statusCode: 409,
        message: `User with email ${createUserDto.email} already exists`,
      });
    }

    const { profile, password, securityLevel, ...userData } = createUserDto;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      ...userData,
      passwordHash,
      securityLevel: securityLevel ?? SecurityLevel.USER,
    });

    if (profile) {
      user.profile = this.profileRepository.create(profile);
    }

    const saved = await this.userRepository.save(user);

    const fullUser = await this.findById(saved.id);

    const accessToken = this.signToken(fullUser);

    // Do not leak the password hash
    const safeUser = this.stripPasswordHash(fullUser);

    return { user: safeUser, accessToken };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: Partial<User>; accessToken: string }> {
    const user = await this.findByEmail(loginDto.email);
    if (!user) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    }

    const passwordMatch = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!passwordMatch) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    }

    const accessToken = this.signToken(user);

    const safeUser = this.stripPasswordHash(user);

    return { user: safeUser, accessToken };
  }

  // ---- Read message handlers ----

  getUser(id: string): Promise<User> {
    return this.findById(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({ relations: { profile: true } });
  }
}
