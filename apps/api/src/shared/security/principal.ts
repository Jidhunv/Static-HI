import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** The authenticated person behind a request, loaded from the database rather than trusted from headers. */
export interface Principal {
  id: string;
  email: string;
  name: string;
  isPlatformAdmin: boolean;
  tenantId?: string;
}

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Principal => ctx.switchToHttp().getRequest().principal,
);
