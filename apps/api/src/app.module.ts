import { Module, MiddlewareConsumer, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_PIPE, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import helmet from 'helmet';
import compression from 'compression';

import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { MastersModule } from './modules/masters/masters.module';
import { PropertyModule } from './modules/property/property.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { B2BModule } from './modules/b2b/b2b.module';
import { B2CModule } from './modules/b2c/b2c.module';
import { AuditModule } from './modules/audit/audit.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FXModule } from './modules/fx/fx.module';
import { RateCardModule } from './modules/rate-card/rate-card.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { PrincipalGuard } from './shared/guards/principal.guard';
import { AllExceptionsFilter } from './shared/filters/exception.filter';
import { SecurityInterceptor } from './shared/interceptors/security.interceptor';
import { SecurityModule } from './shared/security/security.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 100 },
      { name: 'long', ttl: 3600000, limit: 1000 },
    ]),
    PrismaModule,
    SecurityModule,
    AuthModule,
    AdminModule,
    TenantModule,
    MastersModule,
    PropertyModule,
    CurrencyModule,
    B2BModule,
    B2CModule,
    AuditModule,
    ApprovalModule,
    InventoryModule,
    FXModule,
    RateCardModule,
    ApiKeyModule,
  ],
  providers: [
    // Order matters: throttle first, then authenticate. Routes are private unless marked @Public().
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: PrincipalGuard },
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }) },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: SecurityInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(helmet(), compression()).forRoutes('*');
  }
}
