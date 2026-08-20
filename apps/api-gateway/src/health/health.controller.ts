import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @ApiOperation({ summary: 'Health check for Render' })
  @Get()
  check() {
    return { status: 'ok' };
  }
}