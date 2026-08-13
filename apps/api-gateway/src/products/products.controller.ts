import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, throwError } from 'rxjs';
import { MICROSERVICE_CLIENTS } from '../constants';
import { Public } from '../auth/decorators/public.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

interface AuthenticatedUser {
  user: {
    userId: string;
    securityLevel: string;
  };
}

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    @Inject(MICROSERVICE_CLIENTS.PRODUCTS_SERVICE)
    private readonly productsClient: ClientProxy,
  ) {}

  @Public()
  @ApiOperation({ summary: 'List all products' })
  @ApiResponse({ status: 200, description: 'Products returned' })
  @Get()
  getAllProducts() {
    return this.productsClient
      .send('get_all_products', {})
      .pipe(
        catchError((error: unknown) =>
          throwError(() => this.handleRpcError(error)),
        ),
      );
  }

  @Public()
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiResponse({ status: 200, description: 'Product returned' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Get(':id')
  getProductById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsClient
      .send('get_product', id)
      .pipe(
        catchError((error: unknown) =>
          throwError(() => this.handleRpcError(error)),
        ),
      );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product (MODERATOR/ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Post()
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsClient
      .send('create_product', {
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        stock: createProductDto.stock,
        active: createProductDto.active ?? true,
        ...(createProductDto.categoryId && {
          category: { id: createProductDto.categoryId },
        }),
      })
      .pipe(
        catchError((error: unknown) =>
          throwError(() => this.handleRpcError(error)),
        ),
      );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (MODERATOR/ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Put()
  updateProduct(
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: AuthenticatedUser,
  ) {
    return this.productsClient
      .send('update_product', {
        id: updateProductDto.id,
        userId: req.user.userId,
        securityLevel: req.user.securityLevel,
        updateProductDto: {
          ...(updateProductDto.name && { name: updateProductDto.name }),
          ...(updateProductDto.description !== undefined && {
            description: updateProductDto.description,
          }),
          ...(updateProductDto.price !== undefined && {
            price: updateProductDto.price,
          }),
          ...(updateProductDto.stock !== undefined && {
            stock: updateProductDto.stock,
          }),
          ...(updateProductDto.active !== undefined && {
            active: updateProductDto.active,
          }),
          ...(updateProductDto.categoryId && {
            category: { id: updateProductDto.categoryId },
          }),
        },
      })
      .pipe(
        catchError((error: unknown) =>
          throwError(() => this.handleRpcError(error)),
        ),
      );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product (MODERATOR/ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Delete(':id')
  deleteProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedUser,
  ) {
    return this.productsClient
      .send('delete_product', {
        id,
        userId: req.user.userId,
        securityLevel: req.user.securityLevel,
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
