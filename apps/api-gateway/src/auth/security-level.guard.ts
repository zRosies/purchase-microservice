import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  SECURITY_LEVEL_KEY,
  SecurityLevel,
} from './decorators/security-level.decorator';

@Injectable()
export class SecurityLevelGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredLevels = this.reflector.getAllAndOverride<SecurityLevel[]>(
      SECURITY_LEVEL_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No security level required => allow
    if (!requiredLevels || requiredLevels.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const userLevel = user.securityLevel as SecurityLevel;

    if (!requiredLevels.includes(userLevel)) {
      throw new ForbiddenException(
        `Requires security level: ${requiredLevels.join(', ')}`,
      );
    }

    return true;
  }
}
