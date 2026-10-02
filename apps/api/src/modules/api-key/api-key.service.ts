import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a new API key for a tenant
   */
  async generateApiKey(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      permissions: string[];
      rateLimit?: number;
      allowedOrigins?: string[];
      allowedIPs?: string[];
      expiresAt?: Date;
    },
    createdBy?: string,
  ) {
    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Generate raw key (50 chars: sk_live_ + 42 random chars)
    const rawKey = `sk_live_${crypto.randomBytes(32).toString('hex').substring(0, 32)}`;
    const keyHash = this.hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 8);

    // Create API key record
    const apiKey = await this.prisma.apiKey.create({
      data: {
        tenantId,
        keyHash,
        keyPrefix,
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        rateLimit: data.rateLimit || 1000,
        allowedOrigins: data.allowedOrigins || [],
        allowedIPs: data.allowedIPs || [],
        expiresAt: data.expiresAt,
        createdBy,
        status: 'active',
      },
    });

    // Return the raw key only once (never again)
    return {
      id: apiKey.id,
      key: rawKey,
      keyPrefix: apiKey.keyPrefix,
      name: apiKey.name,
      message: 'Save this key securely. You will not be able to see it again.',
    };
  }

  /**
   * Validate API key and return associated tenant
   */
  async validateApiKey(rawKey: string, ipAddress?: string, origin?: string) {
    // Hash the provided key
    const keyHash = this.hashKey(rawKey);

    // Find API key
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { tenant: true },
    });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if key is active
    if (apiKey.status !== 'active') {
      throw new UnauthorizedException(`API key is ${apiKey.status}`);
    }

    // Check if key has expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Check IP restriction
    if (apiKey.allowedIPs.length > 0 && ipAddress) {
      if (!apiKey.allowedIPs.includes(ipAddress)) {
        throw new UnauthorizedException('Request from unauthorized IP address');
      }
    }

    // Check origin restriction (CORS)
    if (apiKey.allowedOrigins.length > 0 && origin) {
      if (!apiKey.allowedOrigins.includes(origin)) {
        throw new UnauthorizedException('Request from unauthorized origin');
      }
    }

    // Update last used time
    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      apiKeyId: apiKey.id,
      tenantId: apiKey.tenantId,
      tenant: apiKey.tenant,
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
    };
  }

  /**
   * List API keys for a tenant
   */
  async listApiKeys(tenantId: string) {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { tenantId },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        description: true,
        permissions: true,
        rateLimit: true,
        status: true,
        allowedOrigins: true,
        allowedIPs: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiKeys;
  }

  /**
   * Get single API key details
   */
  async getApiKey(apiKeyId: string, tenantId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        tenantId,
      },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        description: true,
        permissions: true,
        rateLimit: true,
        allowedOrigins: true,
        allowedIPs: true,
        status: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return apiKey;
  }

  /**
   * Update API key
   */
  async updateApiKey(
    apiKeyId: string,
    tenantId: string,
    data: {
      name?: string;
      description?: string;
      permissions?: string[];
      rateLimit?: number;
      allowedOrigins?: string[];
      allowedIPs?: string[];
      expiresAt?: Date;
    },
  ) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        tenantId,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    const updated = await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        rateLimit: data.rateLimit,
        allowedOrigins: data.allowedOrigins,
        allowedIPs: data.allowedIPs,
        expiresAt: data.expiresAt,
      },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        description: true,
        permissions: true,
        rateLimit: true,
        allowedOrigins: true,
        allowedIPs: true,
        status: true,
        expiresAt: true,
      },
    });

    return updated;
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(apiKeyId: string, tenantId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        tenantId,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    const revoked = await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { status: 'revoked' },
    });

    return { message: 'API key revoked successfully' };
  }

  /**
   * Log API request
   */
  async logApiRequest(data: {
    apiKeyId: string;
    method: string;
    endpoint: string;
    statusCode: number;
    responseTime: number;
    ipAddress: string;
    userAgent?: string;
    origin?: string;
    errorMessage?: string;
  }) {
    try {
      await this.prisma.apiLog.create({
        data: {
          apiKeyId: data.apiKeyId,
          method: data.method,
          endpoint: data.endpoint,
          statusCode: data.statusCode,
          responseTime: data.responseTime,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          origin: data.origin,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      // Don't fail the request if logging fails
      console.error('Failed to log API request:', error);
    }
  }

  /**
   * Get API usage statistics
   */
  async getApiUsageStats(apiKeyId: string, tenantId: string, days: number = 7) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        tenantId,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get logs
    const logs = await this.prisma.apiLog.findMany({
      where: {
        apiKeyId,
        createdAt: { gte: startDate },
      },
    });

    // Calculate stats
    const totalRequests = logs.length;
    const successRequests = logs.filter((l) => l.statusCode >= 200 && l.statusCode < 300).length;
    const errorRequests = logs.filter((l) => l.statusCode >= 400).length;
    const avgResponseTime =
      logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + l.responseTime, 0) / logs.length) : 0;

    // Group by endpoint
    const byEndpoint = logs.reduce(
      (acc, log) => {
        if (!acc[log.endpoint]) {
          acc[log.endpoint] = 0;
        }
        acc[log.endpoint]++;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Group by status code
    const byStatus = logs.reduce(
      (acc, log) => {
        if (!acc[log.statusCode]) {
          acc[log.statusCode] = 0;
        }
        acc[log.statusCode]++;
        return acc;
      },
      {} as Record<number, number>,
    );

    return {
      period: `Last ${days} days`,
      totalRequests,
      successRequests,
      errorRequests,
      successRate: totalRequests > 0 ? Math.round((successRequests / totalRequests) * 100) : 0,
      avgResponseTime,
      byEndpoint,
      byStatus,
    };
  }

  /**
   * Hash API key
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Check permission
   */
  hasPermission(permissions: string[], requiredPermission: string): boolean {
    return permissions.includes(requiredPermission) || permissions.includes('*');
  }
}
