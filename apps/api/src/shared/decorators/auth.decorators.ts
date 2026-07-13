import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
  CanActivate,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { RequestContext } from '../context/request.context';

export const Context = createParamDecorator(
  (data: keyof RequestContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return data ? request.context?.[data] : request.context;
  },
);

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.context?.tenantId;
  },
);

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.context?.userId;
  },
);

/**
 * Guard that requires authentication and a tenant context.
 */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ctx = request.context;

    if (!ctx?.userId || !ctx?.tenantId) {
      throw new UnauthorizedException('Authentication required');
    }

    return true;
  }
}
