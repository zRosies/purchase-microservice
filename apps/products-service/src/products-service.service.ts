import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from './entities/products.entity';
import { Category } from './entities/products-category.entity';

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: Category;
  active: boolean;
}

export interface CheckStockItem {
  productId: string;
  quantity: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(data: ProductPayload) {
    const product = this.productRepository.create(data);

    return this.productRepository.save(product);
  }

  async checkStock(data: CheckStockItem[]) {
    const productIds = data.map((item) => item.productId);

    const products = await this.productRepository.find({
      where: {
        id: In(productIds),
      },
    });

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    const unavailableItems: {
      productId: string;
      reason: string;
      requested?: number;
      available?: number;
    }[] = [];

    const availableProducts: Product[] = [];

    for (const item of data) {
      const product = productMap.get(item.productId);

      if (!product) {
        unavailableItems.push({
          productId: item.productId,
          reason: 'Product not found',
        });

        continue;
      }

      if (!product.active) {
        unavailableItems.push({
          productId: item.productId,
          reason: 'Product is inactive',
        });

        continue;
      }

      if (product.stock < item.quantity) {
        unavailableItems.push({
          productId: item.productId,
          requested: item.quantity,
          available: product.stock,
          reason: 'Insufficient stock',
        });

        continue;
      }

      availableProducts.push(product);
    }

    return {
      available: unavailableItems.length === 0,
      unavailableItems,
      availableProducts,
    };
  }

  async findAll() {
    const products = await this.productRepository.find();

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      stock: product.stock,
      active: product.active,
    }));
  }

  async findById(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Product with id ${id} not found`,
      });
    }

    return product;
  }

  async update(id: string, data: ProductPayload, securityLevel: string) {
    if (!this.hasHigherPrivileges(securityLevel)) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You do not have permission to delete this product',
      });
    }
    const product = await this.findById(id);

    Object.assign(product, data);

    return this.productRepository.save(product);
  }

  async delete(data: { id: string; userId: string; securityLevel: string }) {
    const product = await this.findById(data.id);

    if (!this.hasHigherPrivileges(data.securityLevel)) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You do not have permission to delete this product',
      });
    }

    await this.productRepository.remove(product);

    return {
      message: `Product ${data.id} deleted successfully`,
    };
  }

  async decreaseStockForItems(
    items: { productId: string; quantity: number }[],
  ) {
    if (!items || items.length === 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'No items provided for stock decrease',
      });
    }
    for (const item of items) {
      await this.decreaseStock(item.productId, item.quantity);
    }
  }

  async decreaseStock(id: string, quantity: number) {
    const product = await this.findById(id);

    if (product.stock < quantity) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Insufficient stock',
      });
    }

    product.stock -= quantity;

    return this.productRepository.save(product);
  }

  async createProduct(product: ProductPayload) {
    const newProduct = this.productRepository.create(product);

    return this.productRepository.save(newProduct);
  }

  private hasHigherPrivileges(securityLevel: string): boolean {
    return securityLevel === 'MODERATOR' || securityLevel === 'ADMIN';
  }
}
