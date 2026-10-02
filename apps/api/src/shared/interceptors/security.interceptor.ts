import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { throwError } from 'rxjs';

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityInterceptor.name);
  private readonly sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'];
    const userId = (request as any).user?.id || 'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(`[${method}] ${url} | User: ${userId} | IP: ${ip} | Duration: ${duration}ms | Status: 200`);
      }),
      catchError(error => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `[${method}] ${url} | User: ${userId} | IP: ${ip} | Duration: ${duration}ms | Error: ${error.message}`,
          error.stack,
        );
        return throwError(() => error);
      }),
    );
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) return data;

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const field of this.sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}