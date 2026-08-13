import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductsService } from './products-service.service';
import type {
  CheckStockItem,
  ProductPayload,
} from './products-service.service';

export interface OrderedItemPayload {
  productId: string;
  quantity: number;
}

@Controller()
export class ProductsServiceController {
  constructor(private readonly productsServiceService: ProductsService) {}

  @MessagePattern('create_product')
  async createProduct(payload: ProductPayload) {
    return this.productsServiceService.createProduct(payload);
  }

  @MessagePattern('get_product')
  async getProduct(id: string) {
    return this.productsServiceService.findById(id);
  }

  @MessagePattern('get_all_products')
  async getAllProducts() {
    return this.productsServiceService.findAll();
  }

  @MessagePattern('delete_product')
  async deleteProduct(data: { id: string; securityLevel: string }) {
    return this.productsServiceService.delete(data);
  }

  @MessagePattern('check_stock')
  async checkStock(payload: CheckStockItem[]) {
    return this.productsServiceService.checkStock(payload);
  }
  @MessagePattern('decrease_stock')
  async decreaseStock(
    payload: CheckStockItem[] | CheckStockItem | { items: CheckStockItem[] },
  ) {
    let items: CheckStockItem[];

    if (Array.isArray(payload)) {
      items = payload;
    } else if (payload && 'items' in payload) {
      items = payload.items;
    } else {
      items = [payload];
    }

    return this.productsServiceService.decreaseStockForItems(items);
  }
}
