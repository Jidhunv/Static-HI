import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Set the RLS tenant context for this request.
   * Must be called before any queries that should be tenant-scoped.
   */
  async setTenantContext(tenantId: string) {
    await this.$executeRawUnsafe(
      `SELECT set_config('app.tenant_id', $1, false)`,
      tenantId,
    );
  }

  /**
   * Clear the RLS tenant context after the request is done.
   */
  async clearTenantContext() {
    await this.$executeRawUnsafe(
      `SELECT set_config('app.tenant_id', '', false)`,
    );
  }
}
