import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyService } from './api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required. Pass it via Authorization header or x-api-key header.');
    }

    try {
      const ipAddress = this.getClientIp(request);
      const origin = request.headers.origin || request.headers.referer;

      const validatedKey = await this.apiKeyService.validateApiKey(apiKey, ipAddress, origin);

      // Attach to request for later use
      request.apiKey = validatedKey;
      request.apiKeyId = validatedKey.apiKeyId;
      request.tenantId = validatedKey.tenantId;
      request.permissions = validatedKey.permissions;

      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid API key');
    }
  }

  /**
   * Extract API key from request
   * Supports multiple formats:
   * 1. Authorization: Bearer sk_live_...
   * 2. x-api-key: sk_live_...
   */
  private extractApiKey(request: Request): string | null {
    // Check Authorization header (Bearer)
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        return parts[1];
      }
    }

    // Check x-api-key header
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader) {
      return Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
    }

    // Check query parameter (less secure, but supported)
    const queryKey = request.query.api_key as string | undefined;
    if (queryKey) {
      return Array.isArray(queryKey) ? queryKey[0] : queryKey;
    }

    return null;
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: Request): string {
    // Check headers set by proxies
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
      return (ips[0] || '').trim();
    }

    // Fallback to direct connection
    return request.ip || request.connection.remoteAddress || 'unknown';
  }
}

/**
 * Decorator to check specific permissions
 * Usage: @CheckPermission('booking.create')
 */
import { UseGuards } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

export const CheckPermission = (permission: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (context: ExecutionContext, ...args: any[]) {
      const request = context.switchToHttp().getRequest();
      const permissions = request.permissions || [];

      if (!permissions.includes(permission) && !permissions.includes('*')) {
        throw new ForbiddenException(`Permission '${permission}' is required`);
      }

      return originalMethod.apply(this, [context, ...args]);
    };
  };
};

/**
 * Decorator to extract API key info
 * Usage: constructor(private apiKey: ApiKeyInfo)
 */
export const ApiKeyInfo = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.apiKey;
});

/**
 * Decorator to extract tenant from API key
 * Usage: constructor(private tenantId: string)
 */
export const TenantFromApiKey = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.tenantId;
});
