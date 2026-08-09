import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import type { CreateUserDto, LoginDto } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('register')
  register(@Payload() createUserDto: CreateUserDto) {
    return this.usersService.register(createUserDto);
  }

  @MessagePattern('login')
  login(@Payload() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  @MessagePattern('get_user')
  getUser(@Payload() id: string) {
    return this.usersService.getUser(id);
  }

  @MessagePattern('get_all_users')
  getAllUsers() {
    return this.usersService.getAllUsers();
  }
}
