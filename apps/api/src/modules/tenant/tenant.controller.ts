import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantService } from './tenant.service';
import { TenantId, Authenticated } from '../../shared/decorators/auth.decorators';

@Controller('tenant')
@Authenticated()
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get('info')
  async getTenantInfo(@TenantId() tenantId: string) {
    return this.tenantService.getTenantInfo(tenantId);
  }

  @Get('settings')
  async getTenantSettings(@TenantId() tenantId: string) {
    return this.tenantService.getTenantSettings(tenantId);
  }
}
