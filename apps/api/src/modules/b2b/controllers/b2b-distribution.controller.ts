import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { B2BDistributionService } from '../services/b2b-distribution.service';
import { TenantId } from '../../../shared/decorators/auth.decorators';

@Controller('b2b/distribution-grants')
export class B2BDistributionController {
  constructor(private distributionService: B2BDistributionService) {}

  @Post('request')
  async requestDistributionAccess(
    @TenantId() resellerTenantId: string,
    @Body() dto: { sourceTenantId: string },
  ) {
    return this.distributionService.requestDistributionAccess(
      resellerTenantId,
      dto.sourceTenantId,
    );
  }

  @Post(':grantId/approve')
  async approveDistributionGrant(
    @TenantId() sourceTenantId: string,
    @Param('grantId') grantId: string,
    @Body() dto: { customB2BMargin?: number },
  ) {
    return this.distributionService.approveDistributionGrant(
      sourceTenantId,
      grantId,
      dto.customB2BMargin,
    );
  }

  @Post(':grantId/reject')
  async rejectDistributionGrant(
    @TenantId() sourceTenantId: string,
    @Param('grantId') grantId: string,
  ) {
    return this.distributionService.rejectDistributionGrant(
      sourceTenantId,
      grantId,
    );
  }

  @Get('outgoing')
  async getOutgoingGrants(
    @TenantId() sourceTenantId: string,
  ) {
    return this.distributionService.getOutgoingGrants(sourceTenantId);
  }

  @Get('incoming')
  async getIncomingGrants(
    @TenantId() targetTenantId: string,
  ) {
    return this.distributionService.getIncomingGrants(targetTenantId);
  }

  @Get(':grantId')
  async getDistributionGrant(
    @TenantId() tenantId: string,
    @Param('grantId') grantId: string,
  ) {
    return this.distributionService.getDistributionGrant(grantId, tenantId);
  }
}
