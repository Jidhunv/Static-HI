import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Principal } from '../security/principal';

/** Verifies the bearer token and loads the active user or platform admin it belongs to. */
@Injectable()
export class PrincipalGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      const user = await this.prisma.tenantUser.findUnique({ where: { id: payload.sub } });
      if (user?.status === 'active') {
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

    request.principal = principal;
    return true;
  }
}
