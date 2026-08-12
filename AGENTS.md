# Project Context

## Overview

E-commerce microservices monorepo built with NestJS, TypeORM, RabbitMQ, and Stripe Checkout.

## Architecture

| Service | Port | Transport | Purpose |
| --- | --- | --- | --- |
| **api-gateway** | 3000 | HTTP (REST) | Entry point, JWT auth, proxies to services via TCP |
| **order-service** | 3001 | TCP + RabbitMQ | Order CRUD, stock validation via products-service, emits `order.created` |
| **user-service** | 3002 | TCP | Auth (register/login), user & profile management |
| **payment-service** | 3003 | TCP + RabbitMQ | Stripe checkout session creation, (future) webhook handling |
| **products-service** | 3004 | TCP | Product catalog + stock checking/decrement |
| **notification-service** | — | HTTP (boilerplate) | Default "Hello World" scaffold, NOT wired in `start:all` or docker-compose |

## Communication

- **TCP** (`@nestjs/microservices`, host `127.0.0.1`) for synchronous request/response
- **RabbitMQ** for async events (`order.created`, future `payment.succeeded`/`payment.failed`)
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

### Events (RabbitMQ)

- order-service emits `order.created` on queue **`order_events`** after persisting an order
- payment-service currently subscribes on queue **`orders_events`** — **queue name mismatch**, so `order.created` is not delivered. Fix by aligning the queue name (e.g. unify on `order_events`).

## Auth

- Gateway validates JWT Bearer tokens (`passport-jwt`, `JWT_SECRET`)
- Global `JwtAuthGuard` + `SecurityLevelGuard`; endpoints opt out with `@Public()`
- Security levels: `USER`, `MODERATOR`, `ADMIN` (enforced in order-service via `hasHigherPrivileges`)

## Stripe Integration (working)

- **Flow**: `POST /payments/:id` (JWT, UUID) → gateway → TCP `create_checkout_session` → payment-service fetches order via TCP `get_order` → validates order has items → `StripePaymentProvider.createCheckoutSession()` → returns `{ url, sessionId }`
- Files:
  - `apps/api-gateway/src/payments/payments.controller.ts` (REST endpoint, RPC error mapping)
  - `apps/payment-service/src/payment-service.service.ts` (orchestration)
  - `apps/payment-service/src/providers/stripePaymentProviders.ts` (Stripe client + session creation)
  - `apps/payment-service/src/providers/providers.ts` (`PaymentProvider` contract)
- **Config** (from `apps/payment-service/.env`): `STRIPE_SECRET_KEY` (required), `STRIPE_CURRENCY` (default `brl`)
- Session: `mode: 'payment'`, `payment_method_types: ['card']`, metadata `orderId` + `userId`, amount = `unitPrice * 100` per line item
- **Success/cancel URLs are hardcoded** in `payment-service.service.ts` (`https://www.google.com` / `https://www.youtube.com`) — should come from the client/DB

### Not yet wired (stubbed/commented out)

- Stripe webhook handler (`stripe_webhook` pattern, `constructWebhookEvent`, gateway `POST /payments/webhook` with `req.rawBody`)
- `payment.succeeded` / `payment.failed` event emission and handling in order-service (`@EventPattern` handlers commented out)
- Order status transition to `PAID` / `CANCELLED` after payment (`OrdersService.paymentSucceeded` / `paymentFailed` exist but are unused)
- Stock decrement on payment success (`decrease_stock` in products-service exists, unused)

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
- If `order.created` events are not received by payment-service, check the RabbitMQ queue names (`order_events` vs `orders_events`)

## Current Status

- Order creation flow works (create_order → check_stock → persist order → emit `order.created`)
- JWT auth + security levels work (register/login, guarded routes)
- Stripe checkout session creation works (create_checkout_session → fetch order → Stripe session → return `{ url, sessionId }`)
- Pending: Stripe webhook, payment.succeeded/failed events, order status update to PAID, stock decrement
