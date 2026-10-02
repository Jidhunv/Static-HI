import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC, PLATFORM_ADMIN_ONLY } from '../security/access.decorators';
import { Principal } from '../security/principal';

/**
 * Global guard. Unless a route is marked @Public(), it verifies the bearer token and loads the
 * active user or platform admin it belongs to; nothing else in the token or request is trusted.
 */
@Injectable()
export class PrincipalGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Authentication required');

    let payload: { sub?: string; type?: string };
    try {
      payload = this.jwt.verify(header.substring(7));
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (!payload.sub) throw new UnauthorizedException('Invalid token');

    let principal: Principal | null = null;
    if (payload.type === 'admin') {
      const admin = await this.prisma.platformAdmin.findUnique({ where: { id: payload.sub } });
      if (admin?.status === 'active') {
        principal = { id: admin.id, email: admin.email, name: admin.name, isPlatformAdmin: true };
      }
    } else {
      const user = await this.prisma.tenantUser.findUnique({
        where: { id: payload.sub },
        include: { tenant: { select: { status: true } } },
      });
      // Suspending a user or its whole tenant takes effect on the next request.
      if (user?.status === 'active' && user.tenant.status === 'active') {
        principal = {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          isPlatformAdmin: false,
          tenantId: user.tenantId,
        };
      }
    }
    if (!principal) throw new UnauthorizedException('Account not found or inactive');

    if (this.reflector.getAllAndOverride<boolean>(PLATFORM_ADMIN_ONLY, targets) && !principal.isPlatformAdmin) {
      throw new ForbiddenException('Platform admin only');
    }

    request.principal = principal;
    return true;
  }
}
