import {
  Body,
  Controller,
  Headers,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MICROSERVICE_CLIENTS } from '../constants';
import { catchError, throwError } from 'rxjs';

interface AuthenticatedUser {
  user: {
    userId: string;
    securityLevel: string;
  };
}

interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(
    @Inject(MICROSERVICE_CLIENTS.PAYMENTS_SERVICE)
    private readonly paymentsClient: ClientProxy,
  ) {}

  @Post(':id')
  createCheckoutSession(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedUser,
  ) {
    return this.paymentsClient
      .send<CheckoutSessionResponse>('create_checkout_session', {
        id,
        userId: req.user.userId,
        securityLevel: req.user.securityLevel,
      })
      .pipe(
        catchError((error: unknown) =>
          throwError(() => this.handleRpcError(error)),
        ),
      );
  }

  // @Public()
  // @Post('webhook')
  // async stripeWebhook(
  //   @Req() req: any,
  //   @Headers('stripe-signature') signature: string,
  // ) {
  //   const rawBody = req.rawBody;
  //   return lastValueFrom(
  //     this.paymentsClient.send('stripe_webhook', {
  //       rawBody,
  //       signature,
  //     }),
  //   );
  // }

  private handleRpcError(error: unknown): HttpException {
    interface RpcError {
      status?: number;
      message?: string;
      items?: unknown;
    }

    const rpcError: RpcError =
      typeof error === 'object' && error !== null && 'error' in error
        ? (error.error as RpcError)
        : (error as RpcError);

    const status =
      typeof rpcError?.status === 'number'
        ? rpcError.status
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = rpcError?.message || 'Internal server error';
    const items = rpcError?.items;

    return new HttpException({ message, items }, status);
  }
}
