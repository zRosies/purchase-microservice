import { Controller, Get } from '@nestjs/common';
import { PaymentServiceService } from './payment-service.service';

@Controller()
export class PaymentServiceController {
  constructor(private readonly paymentServiceService: PaymentServiceService) {}

  @Get()
  getHello(): string {
    return this.paymentServiceService.getHello();
  }

  // @MessagePattern('process_payment')
  // async processPayment(
  //   @Payload() payload: { orderId: string; userId: string; total: number },
  // ) {
  //   // call Stripe / mocked processor
  //   const success = true;

  //   return {
  //     orderId: payload.orderId,
  //     ok: success,
  //     status: success ? 'PAID' : 'FAILED',
  //     total: payload.total,
  //   };
  // }
}
