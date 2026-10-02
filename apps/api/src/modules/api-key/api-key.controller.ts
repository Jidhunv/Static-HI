import { Controller, Post, Get, Patch, Delete, Param, Body, Query, Headers, Ip } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { PlatformAdminOnly } from '../../shared/security/access.decorators';

@PlatformAdminOnly()
@Controller('api-keys')
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  /**
   * Generate a new API key
   */
  @Post()
  async generateApiKey(
    @Body()
    dto: {
      tenantId: string;
      name: string;
      description?: string;
      permissions: string[];
      rateLimit?: number;
      allowedOrigins?: string[];
      allowedIPs?: string[];
      expiresAt?: string;
    },
  ) {
    return this.apiKeyService.generateApiKey(
      dto.tenantId,
      {
        name: dto.name,
        description: dto.description,
        permissions: dto.permissions,
        rateLimit: dto.rateLimit,
        allowedOrigins: dto.allowedOrigins,
        allowedIPs: dto.allowedIPs,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    );
  }

  /**
   * List all API keys for a tenant
   */
  @Get('tenant/:tenantId')
  async listApiKeys(@Param('tenantId') tenantId: string) {
    return this.apiKeyService.listApiKeys(tenantId);
  }

  /**
   * Get API key details
   */
  @Get(':apiKeyId/tenant/:tenantId')
  async getApiKey(
    @Param('apiKeyId') apiKeyId: string,
    @Param('tenantId') tenantId: string,
  ) {
    return this.apiKeyService.getApiKey(apiKeyId, tenantId);
  }

  /**
   * Update API key
   */
  @Patch(':apiKeyId/tenant/:tenantId')
  async updateApiKey(
    @Param('apiKeyId') apiKeyId: string,
    @Param('tenantId') tenantId: string,
    @Body()
    dto: {
      name?: string;
      description?: string;
      permissions?: string[];
      rateLimit?: number;
      allowedOrigins?: string[];
      allowedIPs?: string[];
      expiresAt?: string;
    },
  ) {
    return this.apiKeyService.updateApiKey(apiKeyId, tenantId, {
      name: dto.name,
      description: dto.description,
      permissions: dto.permissions,
      rateLimit: dto.rateLimit,
      allowedOrigins: dto.allowedOrigins,
      allowedIPs: dto.allowedIPs,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  /**
   * Revoke an API key
   */
  @Delete(':apiKeyId/tenant/:tenantId')
  async revokeApiKey(
    @Param('apiKeyId') apiKeyId: string,
    @Param('tenantId') tenantId: string,
  ) {
    return this.apiKeyService.revokeApiKey(apiKeyId, tenantId);
  }

  /**
   * Get API usage statistics
   */
  @Get(':apiKeyId/stats/tenant/:tenantId')
  async getApiUsageStats(
    @Param('apiKeyId') apiKeyId: string,
    @Param('tenantId') tenantId: string,
    @Query('days') days?: string,
  ) {
    return this.apiKeyService.getApiUsageStats(apiKeyId, tenantId, days ? parseInt(days) : 7);
  }

  /**
   * Validate API key (internal endpoint for middleware)
   */
  @Post('validate')
  async validateApiKey(
    @Body() dto: { apiKey: string },
    @Headers('origin') origin?: string,
    @Ip() ipAddress?: string,
  ) {
    return this.apiKeyService.validateApiKey(dto.apiKey, ipAddress, origin);
  }
}
