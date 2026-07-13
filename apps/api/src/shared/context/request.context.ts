// Request context attached to Express request by middleware
export interface RequestContext {
  userId?: string;
  userEmail?: string;
  tenantId?: string;
  role?: string;
  permissions?: string[];
}

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}
