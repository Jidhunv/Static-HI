import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MFAGuard } from '../guards/mfa.guard';
import { PrincipalGuard } from '../guards/principal.guard';
import { EncryptionService } from './encryption.service';
import { MfaController } from './mfa.controller';
import { MFAService } from './mfa.service';

@Global()
@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'dev-secret-change-in-production' })],
  controllers: [MfaController],
  providers: [EncryptionService, MFAService, PrincipalGuard, MFAGuard],
  exports: [EncryptionService, MFAService, PrincipalGuard, MFAGuard, JwtModule],
})
export class SecurityModule {}
