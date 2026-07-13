import {
  createParamDecorator,
  ExecutionContext,
  UseGuards,
  applyDecorators,
  Inject,
  Injectable,
  CanActivate,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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

/**
 * Guard that requires a specific role.
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private requiredRole: string) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ctx = request.context;

    if (ctx?.role !== this.requiredRole && ctx?.role !== 'admin') {
      throw new ForbiddenException(`Role '${this.requiredRole}' required`);
    }

    return true;
  }
}

/**
 * Decorator: require authentication
 */
export const Authenticated = () =>
  applyDecorators(UseGuards(AuthGuard('jwt'), AuthenticatedGuard));

/**
 * Decorator: require specific role
 */
export const RequireRole = (role: string) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    return UseGuards(AuthGuard('jwt'), new RoleGuard(role))(
      target,
      propertyKey,
      descriptor,
    );
  };
};
