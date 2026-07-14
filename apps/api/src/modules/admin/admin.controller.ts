import { Controller, Get, Post, Param, UseGuards, HttpCode } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
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
