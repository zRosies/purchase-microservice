import {
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
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    @Inject(MICROSERVICE_CLIENTS.PAYMENTS_SERVICE)
    private readonly paymentsClient: ClientProxy,
  ) {}

  // Stripe calls this endpoint directly (no JWT) — must be declared before @Post(':id')
  @Public()
  @ApiOperation({
    summary: 'Stripe webhook receiver (Stripe calls this directly)',
  })
  @ApiResponse({ status: 200, description: 'Event acknowledged' })
  @ApiResponse({ status: 400, description: 'Signature verification failed' })
  @Post('webhook')
  stripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsClient
      .send('stripe_webhook', {
        rawBody: req.rawBody,
        signature,
      })
      .pipe(
        catchError((error: unknown) =>
          throwError(() => this.handleRpcError(error)),
        ),
      );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe checkout session for an order' })
  @ApiResponse({
    status: 200,
    description: 'Checkout session created',
    schema: {
      properties: { url: { type: 'string' }, sessionId: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 400, description: 'Order has no items' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Post(':id')
  createCheckoutSession(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedUser,
  ) {
    return this.paymentsClient
      .send<CheckoutSessionResponse>('create_checkout_session', {
        orderId: id,
        userId: req.user.userId,
        securityLevel: req.user.securityLevel,
      })
      .pipe(
        catchError((error: unknown) =>
          throwError(() => this.handleRpcError(error)),
        ),
      );
  }

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
