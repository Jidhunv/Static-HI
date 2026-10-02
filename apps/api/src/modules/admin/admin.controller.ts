import { Controller, Get, Post, Param, HttpCode } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PlatformAdminOnly } from '../../shared/security/access.decorators';

@Controller('admin')
@PlatformAdminOnly()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('tenants')
  async getTenants() {
    return this.adminService.getTenants();
  }

  @Post('tenants/:id/approve')
  @HttpCode(200)
  async approveTenant(@Param('id') tenantId: string) {
    return this.adminService.approveTenant(tenantId);
  }

  @Post('tenants/:id/reject')
  @HttpCode(200)
  async rejectTenant(@Param('id') tenantId: string) {
    return this.adminService.rejectTenant(tenantId);
  }
}
