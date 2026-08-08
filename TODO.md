# Task Plan: Connect Orders API to Orders Service with Full CRUD + Persistence

## Steps

- [x] 1. Update `create-order.dto.ts` to drop client-supplied `id` and align with entity shape
- [x] 2. Add `OrdersService` in order-service with TypeORM repositories (forFeature Order, OrderItem)
- [x] 3. Implement `create` to compute total, enrich items via products-service client, persist with cascade
- [x] 4. Implement `findAll`, `findOne`, `update`, `remove` in OrdersService
- [x] 5. Wire `TypeOrmModule.forFeature` in `order-service.module.ts`
- [x] 6. Add message patterns for all CRUD in order-service `orders.controller.ts`
- [x] 7. Enable all endpoints in api-gateway `orders.controller.ts`
- [x] 8. Verify/compile
