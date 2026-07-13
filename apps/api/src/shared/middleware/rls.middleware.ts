import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RLSMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const context = req.context;

    // If tenant context is available, set it for RLS
    if (context?.tenantId) {
      await this.prisma.setTenantContext(context.tenantId);

      // Clear RLS context when response ends
      res.on('finish', async () => {
        await this.prisma.clearTenantContext();
      });
    }

    next();
  }
}
