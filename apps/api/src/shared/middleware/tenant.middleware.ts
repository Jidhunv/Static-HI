import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RequestContext } from '../context/request.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const context: RequestContext = {};

    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = this.jwtService.verify(token);

        context.userId = decoded.sub;
        context.userEmail = decoded.email;
        context.tenantId = decoded.tenant_id;
        context.role = decoded.role;
        context.permissions = decoded.permissions || [];
      }

      // Fallback: try to extract tenant from subdomain (for B2C storefronts)
      if (!context.tenantId) {
        const host = req.hostname;
        const subdomainMatch = host.match(/^([^.]+)\./);
        if (subdomainMatch) {
          context.tenantId = subdomainMatch[1];
        }
      }
    } catch (error) {
      // Silently ignore JWT errors; context.tenantId remains undefined
      // This allows public endpoints to work without auth
    }

    req.context = context;
    next();
  }
}
