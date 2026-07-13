import { Controller, Get } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantId } from '../../shared/decorators/auth.decorators';

@Controller('tenant')
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
