import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
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

export interface orderResponseDto {
  available: boolean;
  unavailableItems: {
    productId: string;
    reason: string;
    requested?: number;
    available?: number;
  }[];
  availableProducts: Product[];
}

export interface orderUpdate {
  userId: string;
  securityLevel: string;
  id: string;
}

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @Inject(MICROSERVICE_CLIENTS.PRODUCTS_SERVICE)
    private readonly productsClient: ClientProxy,
    // Client used to emit domain events into RabbitMQ (order.created)
    @Inject(MICROSERVICE_CLIENTS.ORDER_EVENT_RABBIT_MQ)
    private readonly eventClient: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.eventClient.connect();
      console.log('OrdersService: connected ORDER_EVENT_RABBIT_MQ client');
    } catch (err) {
      console.error(
        'OrdersService: failed to connect ORDER_EVENT_RABBIT_MQ client',
        err,
      );
    }
  }

  async create(createOrderDto: CreateOrderDto): Promise<any> {
    const response: orderResponseDto = await lastValueFrom(
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

    const total = this.calculateTotal(
      createOrderDto.items,
      response.availableProducts,
    );

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

    // Emit order.created event so payment-service (and others) can react asynchronously
    this.eventClient.emit('order.created', {
      orderId: savedOrder.id,
      userId: savedOrder.userId,
      total: savedOrder.total,
      items: orderItems.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        name: it.name,
      })),
    });

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

  async findOrder(data: orderUpdate): Promise<Order> {
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

  async update(data: {
    id: string;
    securityLevel: string;
    userId: string;
    updateOrderDto?: UpdateOrderDto;
  }): Promise<{ message: string; order: Order }> {
    const order = await this.findById(data.id);

    const { items, status } = data.updateOrderDto ?? {};

    if (items === undefined && status === undefined) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message:
          'At least one field must be provided to update the order. Ex: items or status',
      });
    }

    const isOwner = order.userId === data.userId;
    const hasPrivileges = this.hasHigherPrivileges(data.securityLevel);

    // Only the owner or privileged users can update the order
    if (!isOwner && !hasPrivileges) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You do not have access to update this order',
      });
    }

    // Only privileged users can change the status ex: PAYMENT SERVICE OR ADMIN
    if (status !== undefined && !hasPrivileges) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You do not have permission to perform this operation',
      });
    }

    if (status !== undefined) {
      order.status = status;
    }

    // SKIP updating items if none are provided
    if (items !== undefined) {
      const response: orderResponseDto = await lastValueFrom(
        this.productsClient.send('check_stock', items),
      );

      if (!response.available) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'One or more products are unavailable',
          items: response.unavailableItems,
        });
      }
      // Updating order
      order.items = response.availableProducts.map((product) => {
        const item = items.find((item) => item.productId === product.id);

        return this.orderItemRepository.create({
          orderId: order,
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: item!.quantity,
        });
      });

      order.total = this.calculateTotal(items, response.availableProducts);
    }
    const orderUpdated = await this.orderRepository.save(order);

    return {
      message: 'Order Updated Successfuly',
      order: orderUpdated,
    };
  }

  async cancel(data: orderUpdate): Promise<Order> {
    const order = await this.findOrder(data);

    if (order.status === OrderStatus.CANCELLED) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Order is already cancelled',
      });
    }

    order.status = OrderStatus.CANCELLED;

    return this.orderRepository.save(order);
  }

  async paymentSucceeded(orderId: string): Promise<Order> {
    const order = await this.findById(orderId);
    order.status = OrderStatus.PAID;

    this.productsClient.send('decrease_stock', order.items);

    return this.orderRepository.save(order);
  }

  async paymentFailed(orderId: string): Promise<Order> {
    const order = await this.findById(orderId);
    order.status = OrderStatus.CANCELLED;
    return this.orderRepository.save(order);
  }

  private calculateTotal = (
    items: OrderedItemPayload[],
    availableProducts: Product[],
  ): number => {
    return availableProducts.reduce((total, product) => {
      const item = items.find((item) => item.productId === product.id);

      return Number(
        (total + Number(product.price) * item!.quantity).toFixed(2),
      );
    }, 0);
  };

  private hasHigherPrivileges(securityLevel: string): boolean {
    return securityLevel === 'MODERATOR' || securityLevel === 'ADMIN';
  }
}
