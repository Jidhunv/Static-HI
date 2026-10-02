import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { MFAService } from '@shared/security/mfa.service';

@Injectable()
export class MFAGuard implements CanActivate {
  constructor(private mfa: MFAService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id || req.headers['x-tenant-id'];
    const mfaToken = req.headers['x-mfa-token'];

    if (!userId) throw new ForbiddenException('No user');

    if (mfaToken) {
      const valid = await this.mfa.validateMFA(userId, mfaToken);
      if (!valid) throw new ForbiddenException('Invalid MFA');
    }

    return true;
  }
}
