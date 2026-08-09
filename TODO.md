# Task Plan: JWT Authentication + Role-Based Access Control

## Status: COMPLETE

### api-gateway

- [x] Create `auth/dto/login.dto.ts` and `auth/dto/register.dto.ts`
- [x] Create `auth/auth.service.ts` (forwards register/login to user-service, typed AuthResult)
- [x] Create `auth/auth.controller.ts` (`/auth/register`, `/auth/login` marked @Public)
- [x] Create `auth/decorators/public.decorator.ts` and `security-level.decorator.ts`
- [x] Create `auth/jwt.strategy.ts` (validates JWT, returns user payload)
- [x] Create `auth/jwt-auth.guard.ts` (respects @Public)
- [x] Create `auth/security-level.guard.ts` (role-based access)
- [x] Create `auth/auth.module.ts`
- [x] Wire `AuthModule` into `api-gateway.module.ts`
- [x] Register `JwtAuthGuard` + `SecurityLevelGuard` globally in `main.ts`

### user-service

- [x] JWT signing in `users.service.ts` (register/login return { user, accessToken })
- [x] `@MessagePattern('register')` / `@MessagePattern('login')` in controller
- [x] JwtModule wired in `users.module.ts`

### Dependencies

- [x] Installed `@types/bcrypt`

### Verification

- [x] api-gateway compiles (tsc --noEmit)
- [x] user-service compiles (tsc --noEmit)
- [x] order-service compiles (tsc --noEmit)
