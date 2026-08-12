import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductsService } from './products-service.service';
import type { CheckStockItem } from './products-service.service';

export interface OrderedItemPayload {
  productId: string;
  quantity: number;
}

@Controller()
export class ProductsServiceController {
  constructor(private readonly productsServiceService: ProductsService) {}

  @MessagePattern('get_product')
  async getProduct(id: string) {
    return this.productsServiceService.findById(id);
  }
  @MessagePattern('check_stock')
  async checkStock(payload: CheckStockItem[]) {
    return this.productsServiceService.checkStock(payload);
  }
  @MessagePattern('decrease_stock')
  async decreaseStock(payload: CheckStockItem) {
    return this.productsServiceService.decreaseStock(
      payload.productId,
      payload.quantity,
    );
  }
}
