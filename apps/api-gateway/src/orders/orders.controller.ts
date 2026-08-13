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

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

interface AuthenticatedUser {
  user: {
    userId: string;
    securityLevel: string;
  };
}

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(MICROSERVICE_CLIENTS.ORDERS_SERVICE)
    private orderServiceClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Post()
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: AuthenticatedUser,
  ) {
    return this.orderServiceClient
      .send('create_order', { ...createOrderDto, userId: req.user.userId })
      .pipe(
        catchError((error: unknown) =>
          throwError(() => this.handleRpcError(error)),
        ),
      );
  }

  @ApiOperation({ summary: 'List all orders' })
  @ApiResponse({ status: 200, description: 'Orders returned' })
  @Get()
  findAll(@Req() req: AuthenticatedUser) {
    return this.orderServiceClient
      .send('get_all_orders', req.user.securityLevel)
      .pipe(
        catchError((error: unknown) =>
          throwError(() => this.handleRpcError(error)),
        ),
      );
  }

  @ApiOperation({ summary: 'Get a single order by id' })
  @ApiResponse({ status: 200, description: 'Order returned' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedUser,
  ) {
    const { userId, securityLevel } = req.user;
    return this.orderServiceClient
      .send('get_order', { id, userId, securityLevel })
      .pipe(
        catchError((error: unknown) =>
          throwError(() => this.handleRpcError(error)),
        ),
      );
  }

  @ApiOperation({ summary: 'Update an existing order' })
  @ApiResponse({ status: 200, description: 'Order updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Put()
  update(
    @Body() updateOrderDto: UpdateOrderDto,
    @Req() req: AuthenticatedUser,
  ) {
    const { userId, securityLevel } = req.user;

    return this.orderServiceClient
      .send('update_order', {
        id: updateOrderDto.id,
        userId,
        securityLevel,
        updateOrderDto,
      })
      .pipe(
        catchError((error: unknown) =>
          throwError(() => this.handleRpcError(error)),
        ),
      );
  }

  @ApiOperation({ summary: 'Cancel an order by id' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedUser) {
    const { userId, securityLevel } = req.user;
    return this.orderServiceClient
      .send('remove_order', {
        id,
        userId,
        securityLevel,
      })
      .pipe(
        catchError((error: unknown) =>
          throwError(() => this.handleRpcError(error)),
        ),
      );
  }

  private handleRpcError(error: unknown): HttpException {
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
}
