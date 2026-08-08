import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from './entities/products.entity';
import { Category } from './entities/products-category.entity';

interface ProductPayload {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: Category;
  active: boolean;
}

interface CheckStockItem {
  productId: string;
  quantity: number;
}

interface CheckStockPayload {
  items: CheckStockItem[];
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

  async checkStock(data: CheckStockPayload) {
    const productIds = data.items.map((item) => item.productId);

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

    for (const item of data.items) {
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
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async update(id: string, data: ProductPayload) {
    const product = await this.findById(id);

    Object.assign(product, data);

    return this.productRepository.save(product);
  }

  async delete(id: string) {
    const product = await this.findById(id);

    await this.productRepository.remove(product);

    return {
      message: `Product ${id} deleted successfully`,
    };
  }

  async decreaseStock(id: string, quantity: number) {
    const product = await this.findById(id);

    if (product.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    product.stock -= quantity;

    return this.productRepository.save(product);
  }
}
