# Project Context

## Overview

E-commerce microservices monorepo built with NestJS and TypeORM.

## Architecture

- **api-gateway** (port 3000): REST entry point, proxies to microservices via TCP
- **order-service** (port 3001): order CRUD, stock validation via products-service
- **products-service** (port 3004): product catalog + stock checking
- **payment-service**: payment processing
- **user-service**: user management

## Communication

- Transport: TCP (`@nestjs/microservices`)
- api-gateway → order-service via `ClientProxy.send()`
- order-service → products-service via `ClientProxy.send()`

## Workflow

- **Always ask before making changes** — confirm the plan with the user before creating or editing any files.
- Present a clear plan and wait for approval before proceeding.
- Only make changes after the user explicitly approves.

## Conventions

- DTO validation with `class-validator` (whitelist, forbidNonWhitelisted)
- Microservice errors: throw `RpcException` in services, map to `HttpException` in gateway
- Entities: TypeORM with `synchronize: true`
- Run with `npm run start:all` (or individual `start:api`, `start:orders`, etc.)

## Troubleshooting

- If TCP errors appear (`InvalidTcpDataReception`), rebuild with `npm run build` and restart all services
- Rebuild dist before running: the running services use compiled `dist/` output

## Current Status

- Order creation flow works (create_order → check_stock → persist order)
- Order status handling: needs payment-service integration
