import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductsService } from './products-service.service';

@Controller()
export class ProductsServiceController {
  constructor(private readonly productsServiceService: ProductsService) {}

  @MessagePattern('get_product')
  async getProduct(id: string) {
    return this.productsServiceService.findById(id);
  }
}
