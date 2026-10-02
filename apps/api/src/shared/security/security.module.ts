import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MFAGuard } from '../guards/mfa.guard';
import { PrincipalGuard } from '../guards/principal.guard';
import { AccessService } from './access.service';
import { EncryptionService } from './encryption.service';
import { jwtSecret } from './jwt-secret';
import { MfaController } from './mfa.controller';
import { MFAService } from './mfa.service';

@Global()
@Module({
  imports: [
    // The only place tokens are configured. The factory runs after .env is loaded.
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtSecret(),
        signOptions: { expiresIn: parseInt(process.env.JWT_EXPIRATION || '86400') },
      }),
    }),
  ],
  controllers: [MfaController],
  providers: [EncryptionService, MFAService, AccessService, PrincipalGuard, MFAGuard],
  exports: [EncryptionService, MFAService, AccessService, PrincipalGuard, MFAGuard, JwtModule],
})
export class SecurityModule {}
