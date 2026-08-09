import { SetMetadata } from '@nestjs/common';

export const SECURITY_LEVEL_KEY = 'securityLevel';

export enum SecurityLevel {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export const SecurityLevels = (...levels: SecurityLevel[]) =>
  SetMetadata(SECURITY_LEVEL_KEY, levels);
