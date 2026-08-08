import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductsServiceService } from './products-service.service';

@Controller()
export class ProductsServiceController {
  constructor(
    private readonly productsServiceService: ProductsServiceService,
  ) {}

  @Get()
  getHello(): string {
    return this.productsServiceService.getHello();
  }

  @MessagePattern('get_product')
  async getProduct(id: string) {
    return this.productsServiceService.findById(id);
  }
}
