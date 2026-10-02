import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { MFAService } from '../security/mfa.service';

/** Runs after the global PrincipalGuard. Fails closed: no enabled MFA or no valid x-mfa-code means no access. */
@Injectable()
export class MFAGuard implements CanActivate {
  constructor(private mfa: MFAService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const code = request.headers['x-mfa-code'];
    if (!request.principal || typeof code !== 'string' || !(await this.mfa.verify(request.principal, code))) {
      throw new ForbiddenException('A valid MFA code is required: enable MFA and send the code in the x-mfa-code header');
    }
    return true;
  }
}
