import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
// import { TenantUserController } from './tenant-user.controller';
import { TenantUserService } from './tenant-user.service';

@Module({
  controllers: [TenantController],
  providers: [TenantService, TenantUserService],
  exports: [TenantService, TenantUserService],
})
export class TenantModule {}
