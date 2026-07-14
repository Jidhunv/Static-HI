import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLogService } from '../../modules/audit/audit-log.service';

export function Audit(entity: string, action: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const request = args[0];
      const auditService = this.auditService || this.constructor.prototype.auditService;

      try {
        const result = await originalMethod.apply(this, args);

        if (auditService) {
          await auditService.log({
            tenantId: request.user?.tenantId,
            userId: request.user?.id,
            userEmail: request.user?.email,
            userName: request.user?.name,
            action,
            entity,
            entityId: args[1]?.id || request.params?.id,
            entityName: result?.name || request.body?.name,
            changes: { new: result },
            status: 'success',
            ipAddress: request.ip,
            userAgent: request.get('user-agent'),
          });
        }

        return result;
      } catch (error) {
        if (auditService) {
          await auditService.log({
            tenantId: request.user?.tenantId,
            userId: request.user?.id,
            userEmail: request.user?.email,
            userName: request.user?.name,
            action,
            entity,
            entityId: args[1]?.id || request.params?.id,
            status: 'failure',
            errorMessage: error.message,
            ipAddress: request.ip,
            userAgent: request.get('user-agent'),
          });
        }

        throw error;
      }
    };

    return descriptor;
  };
}
