import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from 'apps/products-service/src/entities/products.entity';
import { MICROSERVICE_CLIENTS } from '../constants';

export interface CreateOrderDto {
  userId: string;
  items: OrderedItemPayload[];
}

export interface OrderedItemPayload {
  productId: string;
  quantity: number;
}

export interface UpdateOrderDto {
  userId?: string;
  items?: OrderedItemPayload[];
  status?: OrderStatus;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @Inject(MICROSERVICE_CLIENTS.PRODUCTS_SERVICE)
    private readonly productsClient: ClientProxy,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<any> {
    const response: {
      available: boolean;
      unavailableItems: {
        productId: string;
        reason: string;
        requested?: number;
        available?: number;
      }[];
      availableProducts: Product[];
    } = await lastValueFrom(
      this.productsClient.send('check_stock', createOrderDto.items),
    );

    // --- Checking stock first ---
    if (!response.available) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'One or more products are unavailable',
        items: response.unavailableItems,
      });
    }

    const total = response.availableProducts.reduce((total, product) => {
      const item = createOrderDto.items.find(
        (item) => item.productId === product.id,
      );

      return total + Number(product.price) * item!.quantity;
    }, 0);

    // ---- Creating Order -----

    const order = this.orderRepository.create({
      userId: createOrderDto.userId,
      status: OrderStatus.PENDING,
      total,
    });

    const savedOrder = await this.orderRepository.save(order);

    // -- Link the ordered items to the order
    const orderItems = response.availableProducts.map((product) => {
      const item = createOrderDto.items.find(
        (item) => item.productId === product.id,
      );

      return this.orderItemRepository.create({
        orderId: savedOrder,
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: item!.quantity,
      });
    });

    await this.orderItemRepository.save(orderItems);

    return savedOrder;
  }

  async findAll(securityLevel: string): Promise<Order[]> {
    if (!this.hasHigherPrivileges(securityLevel)) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You do not have access to these orders',
      });
    }

    return this.orderRepository.find({ relations: { items: true } });
  }

  async findOne(data: {
    id: string;
    securityLevel: string;
    userId: string;
  }): Promise<Order> {
    const order = await this.findById(data.id);

    // Only the owner may view the order, unless the user has higher privileges
    if (
      order.userId !== data.userId &&
      !this.hasHigherPrivileges(data.securityLevel)
    ) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You do not have access to this order',
      });
    }

    return order;
  }

  private async findById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { items: true },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    return order;
  }

  private hasHigherPrivileges(securityLevel: string): boolean {
    return securityLevel === 'MODERATOR' || securityLevel === 'ADMIN';
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findById(id);
    return order;
    // updates order .....
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const order = await this.findById(id);
    await this.orderRepository.remove(order);
    return { deleted: true };
  }
}
