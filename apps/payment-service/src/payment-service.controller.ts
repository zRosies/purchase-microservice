import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import type {
  OrderCreatedEvent,
  CreateCheckoutSessionPayload,
} from './payment-service.service';
import { PaymentServiceService } from './payment-service.service';

@Controller()
export class PaymentServiceController {
  private readonly logger = new Logger(PaymentServiceController.name);

  constructor(private readonly paymentServiceService: PaymentServiceService) {}

  // @EventPattern('order.created')
  // async handleOrderCreated(@Payload() payload: OrderCreatedEvent) {
  //   this.logger.log(`Received order.created for orderId=${payload?.orderId}`);
  //   return { handled: true };
  // }

  @MessagePattern('create_checkout_session')
  async createCheckoutSession(
    @Payload() payload: CreateCheckoutSessionPayload,
  ) {
    console.log('hit createCheckoutSession with payload:', payload);
    return this.paymentServiceService.createCheckoutSession(payload);
  }

  @EventPattern('order.created')
  handleOrderCreated(@Payload() payload: OrderCreatedEvent) {
    this.logger.log(`Received order.created for orderId=${payload.orderId}`);
    return { received: true };
  }

  // @MessagePattern('stripe_webhook')
  // async stripeWebhook(@Payload() payload: StripeWebhookPayload) {
  //   return this.paymentServiceService.handleStripeWebhook(payload);
  // }
}
