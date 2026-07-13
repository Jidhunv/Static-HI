import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { MastersModule } from './modules/masters/masters.module';
import { PropertyModule } from './modules/property/property.module';

import { TenantMiddleware } from './shared/middleware/tenant.middleware';
import { RLSMiddleware } from './shared/middleware/rls.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
    PassportModule,
    PrismaModule,
    AuthModule,
    TenantModule,
    MastersModule,
    PropertyModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware, RLSMiddleware)
      .forRoutes('*');
  }
}
