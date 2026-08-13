# Project Context

## Overview

E-commerce microservices monorepo built with NestJS, TypeORM, RabbitMQ, and Stripe Checkout.

## Architecture

| Service | Port | Transport | Purpose |
| --- | --- | --- | --- |
| **api-gateway** | 3000 | HTTP (REST) | Entry point, JWT auth, proxies to services via TCP |
| **order-service** | 3001 | TCP + RabbitMQ | Order CRUD, stock validation via products-service, emits `order.created` |
| **user-service** | 3002 | TCP | Auth (register/login), user & profile management |
| **payment-service** | 3003 | TCP + RabbitMQ | Stripe checkout session creation + webhook handling |
| **products-service** | 3004 | TCP | Product catalog + stock checking/decrement |
| **notification-service** | — | HTTP (boilerplate) | Default "Hello World" scaffold, NOT wired in `start:all` or docker-compose |

## Communication

- **TCP** (`@nestjs/microservices`, host `127.0.0.1`) for synchronous request/response
- **RabbitMQ** for async events (`order.created`, `payment.succeeded`, `payment.failed`)
- api-gateway → order/user/products/payment via `ClientProxy.send()`
- order-service → products-service via `ClientProxy.send()`
- payment-service → order-service via `ClientProxy.send()` (fetches order for checkout)

### Message patterns

| Pattern | From → To | Purpose |
| --- | --- | --- |
| `register`, `login`, `get_user`, `get_all_users` | gateway → user | Auth + user reads |
| `create_order`, `get_all_orders`, `get_order`, `update_order`, `remove_order` | gateway → order | Order CRUD |
| `get_product`, `check_stock`, `decrease_stock` | order → products | Catalog + stock |
| `create_checkout_session` | gateway → payment | Stripe checkout |
| `stripe_webhook` | gateway → payment | Stripe event delivery (raw body + signature) |

### Events (RabbitMQ)

- order-service emits `order.created` on queue **`order_events`** after persisting an order
- payment-service subscribes on queue **`order_events`** (aligned; `ORDERS_EVENTS_QUEUE`/`orders_events` was renamed to `ORDER_EVENTS_QUEUE`/`order_events`)
- payment-service emits `payment.succeeded` / `payment.failed` on queue **`payment_events`** after Stripe webhook events; order-service subscribes on `payment_events`

## Auth

- Gateway validates JWT Bearer tokens (`passport-jwt`, `JWT_SECRET`)
- Global `JwtAuthGuard` + `SecurityLevelGuard`; endpoints opt out with `@Public()`
- Security levels: `USER`, `MODERATOR`, `ADMIN` (enforced in order-service via `hasHigherPrivileges`)

## Stripe Integration (working)

- **Flow**:
  1. `POST /payments/:id` (JWT, UUID) → gateway → TCP `create_checkout_session` → payment-service fetches order via TCP `get_order` → validates order has items → `StripePaymentProvider.createCheckoutSession()` → returns `{ url, sessionId }`
  2. After payment, Stripe calls the webhook → gateway `POST /payments/webhook` (`@Public()`, `rawBody: true`) → TCP `stripe_webhook` → payment-service verifies the signature via `StripePaymentProvider.constructWebhookEvent()` using `STRIPE_WEBHOOK_SECRET`
  3. `checkout.session.completed` → emit `payment.succeeded`; `payment_intent.payment_failed` → emit `payment.failed` on queue `payment_events`
  4. order-service consumes the event → `OrdersService.paymentSucceeded()` awaits `decrease_stock` (products-service) then sets status `PAID`; `paymentFailed()` sets `CANCELLED`
- Files:
  - `apps/api-gateway/src/payments/payments.controller.ts` (REST `POST /payments/:id` + `POST /payments/webhook`, RPC error mapping)
  - `apps/api-gateway/src/main.ts` (`rawBody: true` — required for Stripe signature verification)
  - `apps/payment-service/src/payment-service.service.ts` (orchestration + webhook handler)
  - `apps/payment-service/src/providers/stripePaymentProviders.ts` (Stripe client, session creation, `constructWebhookEvent`)
  - `apps/payment-service/src/providers/providers.ts` (`PaymentProvider` contract)
- **Config** (from `apps/payment-service/.env`): `STRIPE_SECRET_KEY` (required), `STRIPE_WEBHOOK_SECRET` (required for webhooks — currently empty placeholder), `STRIPE_CURRENCY` (default `brl`)
- Session: `mode: 'payment'`, `payment_method_types: ['card']`, metadata `orderId` + `userId`, amount = `unitPrice * 100` per line item
- `decrease_stock` (products-service) accepts a single item, an array, or `{ items: [...] }`

### Remaining / caveats

- **`STRIPE_WEBHOOK_SECRET` is empty** — must be set, and the webhook endpoint (`http://localhost:3000/payments/webhook`) configured in Stripe (dashboard or `stripe listen`) with events `checkout.session.completed` + `payment_intent.payment_failed`
- **Success/cancel URLs are hardcoded** in `payment-service.service.ts` (`https://www.google.com` / `https://www.youtube.com`) — should come from the client/DB
## Workflow

- **Always ask before making changes** — confirm the plan with the user before creating or editing any files.
- Present a clear plan and wait for approval before proceeding.
- Only make changes after the user explicitly approves.

## Conventions

- DTO validation with `class-validator` (whitelist, forbidNonWhitelisted)
- **Microservice error handling**: Services (order-service, user-service, products-service, payment-service) run as `@nestjs/microservices` TCP servers. They MUST throw `RpcException` (from `@nestjs/microservices`) — NOT HTTP exceptions like `BadRequestException`, `NotFoundException`, or `UnauthorizedException`. HTTP exceptions do not serialize correctly over TCP and surface as a generic `Internal server error` in the gateway. The gateway maps `RpcException` responses to `HttpException` for the REST client. (Note: `stripePaymentProviders.ts` currently throws `InternalServerErrorException` — convert to `RpcException` if it ever needs to propagate over TCP.)
- Entities: TypeORM with `synchronize: true`
- Each app has its own `.env` (loaded via `ConfigModule`), its own Postgres database (`users` / `orders` / `products`), and ports are wired via env vars (`ORDERS_PORT`, `PAYMENTS_PORT`, etc.)
- Run with `npm run start:all` (or individual `start:api`, `start:orders`, `start:payment`, `start:products`, `start:users`). `notification-service` is not started by any script.
- Infra: `docker-compose.yml` provides Postgres + RabbitMQ (+ app containers; note `user-service` is missing from compose)

## Troubleshooting

- If TCP errors appear (`InvalidTcpDataReception`), rebuild with `npm run build` and restart all services
- Rebuild dist before running: the running services use compiled `dist/` output
- If `order.created` events are not received by payment-service, check the RabbitMQ queue names (both services must use `order_events`)

## Current Status

- Order creation flow works (create_order → check_stock → persist order → emit `order.created`)
- JWT auth + security levels work (register/login, guarded routes)
- Stripe checkout session creation works (create_checkout_session → fetch order → Stripe session → return `{ url, sessionId }`)
- Stripe webhook → payment.succeeded/failed → order status PAID/CANCELLED + stock decrement is wired in code (pending `STRIPE_WEBHOOK_SECRET` + Stripe endpoint configuration)
- Pending: set `STRIPE_WEBHOOK_SECRET`, configure Stripe webhook endpoint, dynamic success/cancel URLs
