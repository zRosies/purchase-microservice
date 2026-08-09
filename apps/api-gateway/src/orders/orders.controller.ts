import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Inject,
  HttpStatus,
  HttpException,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { MICROSERVICE_CLIENTS } from '../constants';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, throwError } from 'rxjs';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(MICROSERVICE_CLIENTS.ORDERS_SERVICE)
    private orderServiceClient: ClientProxy,
  ) {}

  @Post()
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: AuthenticatedUser,
  ) {
    return this.orderServiceClient
      .send('create_order', { ...createOrderDto, userId: req.user.userId })
      .pipe(
        catchError((error: unknown) => throwError(() => handleRpcError(error))),
      );
  }

  @Get()
  findAll(@Req() req: AuthenticatedUser) {
    return this.orderServiceClient
      .send('get_all_orders', req.user.securityLevel)
      .pipe(
        catchError((error: unknown) => throwError(() => handleRpcError(error))),
      );
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedUser,
  ) {
    const { userId, securityLevel } = req.user;
    return this.orderServiceClient
      .send('get_order', { id, userId, securityLevel })
      .pipe(
        catchError((error: unknown) => throwError(() => handleRpcError(error))),
      );
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderServiceClient.send('update_order', {
      id,
      ...updateOrderDto,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderServiceClient.send('remove_order', id);
  }
}

interface AuthenticatedUser {
  user: {
    userId: string;
    securityLevel: string;
  };
}

function handleRpcError(error: unknown): HttpException {
  interface RpcError {
    status?: number;
    message?: string;
    items?: unknown;
  }

  const rpcError: RpcError =
    typeof error === 'object' && error !== null && 'error' in error
      ? (error.error as RpcError)
      : (error as RpcError);

  const status =
    typeof rpcError?.status === 'number'
      ? rpcError.status
      : HttpStatus.INTERNAL_SERVER_ERROR;

  const message = rpcError?.message || 'Internal server error';
  const items = rpcError?.items;

  return new HttpException({ message, items }, status);
}
