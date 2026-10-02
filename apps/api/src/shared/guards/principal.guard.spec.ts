import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC, PLATFORM_ADMIN_ONLY } from '../security/access.decorators';
import { jwtSecret } from '../security/jwt-secret';
import { PrincipalGuard } from './principal.guard';

const admin = { id: 'a1', email: 'admin@x.test', name: 'Admin', status: 'active' };
const user = { id: 'u1', email: 'user@x.test', firstName: 'Tina', lastName: 'User', status: 'active', tenantId: 't1', tenant: { status: 'active' } };

const pendingUser = { ...user, id: 'u2', tenant: { status: 'pending' } };
const tenantUsers = [user, pendingUser];

function setup(meta: Record<string, boolean> = {}, payload: object | null = null, authorization?: string) {
  const request: any = { headers: { authorization, host: 't2.example.com', 'x-forwarded-host': 't2.example.com' } };
  const jwt = {
    verify: jest.fn(() => {
      if (!payload) throw new Error('bad signature');
      return payload;
    }),
  };
  const prisma = {
    platformAdmin: { findUnique: jest.fn(async ({ where }) => (where.id === admin.id ? admin : null)) },
    tenantUser: { findUnique: jest.fn(async ({ where }) => tenantUsers.find((u) => u.id === where.id) ?? null) },
  };
  const reflector = { getAllAndOverride: jest.fn((key: string) => meta[key]) } as unknown as Reflector;
  const context: any = { getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => request }) };
  const guard = new PrincipalGuard(jwt as any, prisma as any, reflector);
  return { run: () => guard.canActivate(context), request, jwt };
}

describe('PrincipalGuard', () => {
  it('rejects a request with no token', async () => {
    await expect(setup().run()).rejects.toThrow(UnauthorizedException);
  });

  it('lets public routes through without looking at the token', async () => {
    const { run, jwt } = setup({ [IS_PUBLIC]: true });
    await expect(run()).resolves.toBe(true);
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it('rejects a token that fails verification', async () => {
    await expect(setup({}, null, 'Bearer forged').run()).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a valid token for a user that does not exist', async () => {
    await expect(setup({}, { sub: 'nobody' }, 'Bearer t').run()).rejects.toThrow(UnauthorizedException);
  });

  it('takes the tenant from the database, not from token claims or the host', async () => {
    const { run, request } = setup({}, { sub: 'u1', tenant_id: 't2', tenantId: 't2', type: 'user' }, 'Bearer t');
    await expect(run()).resolves.toBe(true);
    expect(request.principal).toMatchObject({ id: 'u1', tenantId: 't1', isPlatformAdmin: false });
  });

  it('rejects a user whose tenant is not active', async () => {
    await expect(setup({}, { sub: 'u2' }, 'Bearer t').run()).rejects.toThrow(UnauthorizedException);
  });

  it('does not make a tenant user an admin because the token says so', async () => {
    await expect(setup({}, { sub: 'u1', type: 'admin', role: 'superadmin' }, 'Bearer t').run()).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refuses tenant users on platform-admin routes and allows admins', async () => {
    const meta = { [PLATFORM_ADMIN_ONLY]: true };
    await expect(setup(meta, { sub: 'u1' }, 'Bearer t').run()).rejects.toThrow(ForbiddenException);
    await expect(setup(meta, { sub: 'a1', type: 'admin' }, 'Bearer t').run()).resolves.toBe(true);
  });
});

describe('jwtSecret', () => {
  const original = process.env.JWT_SECRET;
  afterAll(() => {
    process.env.JWT_SECRET = original;
  });

  it.each([undefined, '', 'short', 'dev-secret-change-in-production'])('refuses %p', (value) => {
    if (value === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = value;
    expect(() => jwtSecret()).toThrow(/JWT_SECRET/);
  });

  it('accepts a long private value', () => {
    process.env.JWT_SECRET = 'x'.repeat(48);
    expect(jwtSecret()).toHaveLength(48);
  });
});
