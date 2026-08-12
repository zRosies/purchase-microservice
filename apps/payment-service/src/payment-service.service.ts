import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import Stripe from 'stripe';
import { StripePaymentProvider } from './providers/stripePaymentProviders';
import { Order } from 'apps/order-service/src/orders/entities/order.entity';
import { OrderItem } from 'apps/order-service/src/orders/entities/order-item.entity';
import { MICROSERVICE_CLIENTS } from './constants';

export interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  total: number;

  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    name: string;
  }>;
}

export interface CreateCheckoutSessionPayload {
  orderId: string;
  successUrl: string;
  cancelUrl: string;
  userId?: string;
  securityLevel?: string;
}

export interface StripeWebhookPayload {
  rawBody: string | Buffer;
  signature: string;
}

export interface PaymentResult {
  orderId: string;
  userId: string;
  amount: number;
  status: 'PAID' | 'FAILED';
  transactionId?: string;
  reason?: string;
  timestamp?: string;
}

@Injectable()
export class PaymentServiceService {
  constructor(
    @Inject(MICROSERVICE_CLIENTS.PAYMENT_EVENTS)
    private readonly paymentEventsClient: ClientProxy,

    @Inject(MICROSERVICE_CLIENTS.ORDER_SERVICE)
    private readonly ordersClient: ClientProxy,

    private readonly paymentProvider: StripePaymentProvider,
  ) {}

  // async onModuleInit(): Promise<void> {
  //   try {
  //     await this.paymentEventsClient.connect();
  //     console.log('PaymentService: connected PAYMENT_EVENTS client');
  //   } catch (error) {
  //     console.error(
  //       'PaymentService: failed to connect PAYMENT_EVENTS client',
  //       error,
  //     );
  //   }

  //   try {
  //     await this.ordersClient.connect();
  //     console.log('PaymentService: connected ORDERS_SERVICE client');
  //   } catch (error) {
  //     console.error(
  //       'PaymentService: failed to connect ORDERS_SERVICE client',
  //       error,
  //     );
  //   }
  // }

  async createCheckoutSession(payload: CreateCheckoutSessionPayload): Promise<{
    url: string;
    sessionId: string;
  }> {
    if (!payload.orderId) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'orderId is required',
      });
    }

    if (!payload.successUrl || !payload.cancelUrl) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'successUrl and cancelUrl are required',
      });
    }

    if (!payload.userId) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'User authentication is required',
      });
    }

    const order: Order = await lastValueFrom(
      this.ordersClient.send('get_order', {
        id: payload.orderId,
        userId: payload.userId,
        securityLevel: payload.securityLevel ?? 'USER',
      }),
    );

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order ${payload.orderId} not found`,
      });
    }

    if (!Array.isArray(order.items) || order.items.length === 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Order has no items',
      });
    }

    const session = await this.paymentProvider.createCheckoutSession({
      orderId: order.id,
      userId: order.userId,

      successUrl: payload.successUrl,
      cancelUrl: payload.cancelUrl,

      items: order.items.map((item: OrderItem) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
    });

    return session;
  }

  // async handleStripeWebhook(
  //   payload: StripeWebhookPayload,
  // ): Promise<{ received: boolean }> {
  //   let event: Stripe.Event;

  //   try {
  //     event = this.paymentProvider.constructWebhookEvent(
  //       payload.rawBody,
  //       payload.signature,
  //     ) as Stripe.Event;
  //   } catch (error) {
  //     throw new RpcException({
  //       status: HttpStatus.BAD_REQUEST,
  //       message: `Webhook signature verification failed: ${
  //         error instanceof Error ? error.message : String(error)
  //       }`,
  //     });
  //   }

  //   switch (event.type) {
  //     case 'checkout.session.completed':
  //       await this.handleCompletedSession(
  //         event.data.object as Stripe.Checkout.Session,
  //       );
  //       break;

  //     case 'payment_intent.payment_failed':
  //       await this.handlePaymentFailed(
  //         event.data.object as Stripe.PaymentIntent,
  //       );
  //       break;

  //     default:
  //       break;
  //   }

  //   return {
  //     received: true,
  //   };
  // }

  private handleCompletedSession(session: Stripe.Checkout.Session): void {
    const orderId = session.metadata?.orderId;
    const userId = session.metadata?.userId;

    if (!orderId || !userId) {
      console.error('Stripe session is missing orderId or userId metadata');

      return;
    }

    const result: PaymentResult = {
      orderId,
      userId,
      amount: Number(session.amount_total ?? 0) / 100,
      status: 'PAID',
      transactionId: String(session.payment_intent),
      timestamp: new Date().toISOString(),
    };

    this.paymentEventsClient.emit('payment.succeeded', result);
  }

  private handlePaymentFailed(intent: Stripe.PaymentIntent): void {
    const orderId = intent.metadata?.orderId;
    const userId = intent.metadata?.userId;

    if (!orderId || !userId) {
      console.error(
        'Stripe PaymentIntent is missing orderId or userId metadata',
      );

      return;
    }

    const result: PaymentResult = {
      orderId,
      userId,
      amount: Number(intent.amount) / 100,
      status: 'FAILED',
      reason: intent.last_payment_error?.message ?? 'Payment failed',
      timestamp: new Date().toISOString(),
    };

    this.paymentEventsClient.emit('payment.failed', result);
  }
}
