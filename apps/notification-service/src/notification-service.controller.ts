import { Controller, Get } from '@nestjs/common';
import { NotificationServiceService } from './notification-service.service';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class NotificationServiceController {
  constructor(
    private readonly notificationServiceService: NotificationServiceService,
  ) {}

  @Get()
  getHello(): string {
    return this.notificationServiceService.getHello();
  }
  @EventPattern('order.created')
  notifyOrderCreated(data) {
    // this.notificationServiceService.
  }

  @EventPattern('payment.succeeded')
  notifyPaymentSucceeded(data) {
    // this.notificationServiceService.
  }
  @EventPattern('payment.checkout.created')
  notifyCheckoutCreated(data) {
    // this.notificationServiceService.
  }
}
