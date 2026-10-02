import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';

/** The signed-in user's tenant. Platform admins have none, so tenant routes refuse them. */
export const TenantId = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const tenantId = ctx.switchToHttp().getRequest().principal?.tenantId;
  if (!tenantId) throw new ForbiddenException('Tenant user only');
  return tenantId;
});

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => ctx.switchToHttp().getRequest().principal?.id,
);
