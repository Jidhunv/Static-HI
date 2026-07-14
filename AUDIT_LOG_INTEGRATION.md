# Audit Log Integration Examples

How to integrate audit logging into existing services.

---

## Example 1: TenantUserService (Complete)

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class TenantUserService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService, // Inject AuditLogService
  ) {}

  async createUser(
    tenantId: string,
    data: { email: string; password: string; firstName: string; lastName: string; roles?: string[] },
    user: any, // Current user making the request
  ) {
    const existing = await this.prisma.tenantUser.findUnique({
      where: { tenantId_email: { tenantId, email: data.email } },
    });
    if (existing) throw new BadRequestException('Email already exists');

    const newUser = await this.prisma.tenantUser.create({
      data: {
        tenantId,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'staff',
        permissions: data.roles || [],
      },
    });

    // Log the activity
    await this.auditLog.log({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'create',
      entity: 'User',
      entityId: newUser.id,
      entityName: `${newUser.firstName} ${newUser.lastName}`,
      changes: { new: newUser },
      status: 'success',
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
    });

    return newUser;
  }

  async updateUser(
    userId: string,
    tenantId: string,
    data: Partial<{ firstName: string; lastName: string; permissions: string[] }>,
    user: any,
  ) {
    const oldUser = await this.prisma.tenantUser.findUnique({ where: { id: userId } });

    const updatedUser = await this.prisma.tenantUser.update({
      where: { id: userId },
      data,
    });

    // Log with changes
    await this.auditLog.log({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'update',
      entity: 'User',
      entityId: userId,
      entityName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      changes: {
        old: oldUser,
        new: updatedUser,
      },
      status: 'success',
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
    });

    return updatedUser;
  }

  async updateStatus(
    userId: string,
    tenantId: string,
    status: 'active' | 'inactive' | 'suspended',
    user: any,
  ) {
    const oldUser = await this.prisma.tenantUser.findUnique({ where: { id: userId } });

    const updatedUser = await this.prisma.tenantUser.update({
      where: { id: userId },
      data: { status },
    });

    await this.auditLog.log({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'update',
      entity: 'User',
      entityId: userId,
      entityName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      changes: {
        old: { status: oldUser.status },
        new: { status: updatedUser.status },
      },
      status: 'success',
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
    });

    return updatedUser;
  }

  async deleteUser(userId: string, tenantId: string, user: any) {
    const deletedUser = await this.prisma.tenantUser.delete({
      where: { id: userId },
    });

    await this.auditLog.log({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'delete',
      entity: 'User',
      entityId: userId,
      entityName: `${deletedUser.firstName} ${deletedUser.lastName}`,
      changes: { deleted: deletedUser },
      status: 'success',
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
    });

    return deletedUser;
  }
}
```

---

## Example 2: PropertyService

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class PropertyService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async createProperty(tenantId: string, data: any, user: any) {
    try {
      const property = await this.prisma.property.create({
        data: {
          tenantId,
          ...data,
        },
      });

      await this.auditLog.log({
        tenantId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        action: 'create',
        entity: 'Property',
        entityId: property.id,
        entityName: property.name,
        changes: { new: property },
        status: 'success',
        ipAddress: user.ipAddress,
        userAgent: user.userAgent,
      });

      return property;
    } catch (error) {
      // Log failed operation
      await this.auditLog.log({
        tenantId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        action: 'create',
        entity: 'Property',
        status: 'failure',
        errorMessage: error.message,
        ipAddress: user.ipAddress,
        userAgent: user.userAgent,
      });

      throw error;
    }
  }

  async updateRates(propertyId: string, tenantId: string, rates: any, user: any) {
    const oldProperty = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: { ...rates },
    });

    await this.auditLog.log({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'update',
      entity: 'Property',
      entityId: propertyId,
      entityName: updatedProperty.name,
      changes: {
        old: oldProperty,
        new: updatedProperty,
      },
      status: 'success',
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
    });

    return updatedProperty;
  }

  async deleteProperty(propertyId: string, tenantId: string, user: any) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    await this.prisma.property.delete({ where: { id: propertyId } });

    await this.auditLog.log({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'delete',
      entity: 'Property',
      entityId: propertyId,
      entityName: property.name,
      changes: { deleted: property },
      status: 'success',
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
    });
  }
}
```

---

## Example 3: BookingService

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async createBooking(tenantId: string, data: any, user: any) {
    const booking = await this.prisma.booking.create({
      data: {
        tenantId,
        ...data,
      },
    });

    await this.auditLog.log({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'create',
      entity: 'Booking',
      entityId: booking.id,
      entityName: booking.systemConfirmationNo,
      changes: { new: booking },
      status: 'success',
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
    });

    return booking;
  }

  async confirmBooking(bookingId: string, tenantId: string, hotelConfirmationNo: string, user: any) {
    const oldBooking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'confirmed',
        hotelConfirmationNo,
      },
    });

    await this.auditLog.log({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'update',
      entity: 'Booking',
      entityId: bookingId,
      entityName: booking.systemConfirmationNo,
      changes: {
        old: {
          status: oldBooking.status,
          hotelConfirmationNo: oldBooking.hotelConfirmationNo,
        },
        new: {
          status: booking.status,
          hotelConfirmationNo: booking.hotelConfirmationNo,
        },
      },
      status: 'success',
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
    });

    return booking;
  }

  async checkInGuest(bookingId: string, tenantId: string, user: any) {
    const oldBooking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'checked_in' },
    });

    await this.auditLog.log({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'update',
      entity: 'Booking',
      entityId: bookingId,
      entityName: booking.systemConfirmationNo,
      changes: {
        old: { status: oldBooking.status },
        new: { status: booking.status },
      },
      status: 'success',
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
    });

    return booking;
  }
}
```

---

## Example 4: CommissionService

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class CommissionService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async approveCommission(commissionId: string, tenantId: string, user: any) {
    const oldCommission = await this.prisma.commission.findUnique({
      where: { id: commissionId },
    });

    const commission = await this.prisma.commission.update({
      where: { id: commissionId },
      data: { status: 'approved' },
    });

    await this.auditLog.log({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'update',
      entity: 'Commission',
      entityId: commissionId,
      entityName: `₹${commission.commissionAmount}`,
      changes: {
        old: { status: oldCommission.status },
        new: { status: commission.status },
      },
      status: 'success',
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
    });

    return commission;
  }

  async markCommissionPaid(commissionId: string, tenantId: string, paidAmount: number, user: any) {
    const oldCommission = await this.prisma.commission.findUnique({
      where: { id: commissionId },
    });

    const commission = await this.prisma.commission.update({
      where: { id: commissionId },
      data: {
        status: 'paid',
        paidAmount,
        paidAt: new Date(),
      },
    });

    await this.auditLog.log({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'update',
      entity: 'Commission',
      entityId: commissionId,
      entityName: `₹${commission.commissionAmount}`,
      changes: {
        old: {
          status: oldCommission.status,
          paidAmount: oldCommission.paidAmount,
        },
        new: {
          status: commission.status,
          paidAmount: commission.paidAmount,
        },
      },
      status: 'success',
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
    });

    return commission;
  }
}
```

---

## Example 5: AuthService (Login/Logout)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async login(email: string, password: string, request: any) {
    try {
      const user = await this.prisma.tenantUser.findUnique({
        where: { email: email as any },
      });

      if (!user || user.password !== password) {
        // Log failed login
        await this.auditLog.log({
          userId: 'anonymous',
          userEmail: email,
          userName: 'Unknown',
          action: 'login',
          entity: 'User',
          status: 'failure',
          errorMessage: 'Invalid credentials',
          ipAddress: request.ip,
          userAgent: request.get('user-agent'),
        });

        throw new Error('Invalid credentials');
      }

      // Log successful login
      await this.auditLog.log({
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        action: 'login',
        entity: 'User',
        entityId: user.id,
        status: 'success',
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });

      // Update last login
      await this.prisma.tenantUser.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      return { user, token: 'jwt_token_here' };
    } catch (error) {
      throw error;
    }
  }

  async logout(userId: string, request: any) {
    const user = await this.prisma.tenantUser.findUnique({
      where: { id: userId },
    });

    await this.auditLog.log({
      tenantId: user.tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'logout',
      entity: 'User',
      entityId: user.id,
      status: 'success',
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });

    return { message: 'Logged out successfully' };
  }
}
```

---

## Controller Integration

```typescript
import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { TenantUserService } from './tenant-user.service';

@Controller('tenants/:tenantId/users')
export class TenantUserController {
  constructor(private userService: TenantUserService) {}

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    // Pass request with user info to service
    return this.userService.createUser(req.params.tenantId, body, {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Put(':userId')
  async update(@Body() body: any, @Req() req: any) {
    return this.userService.updateUser(
      req.params.userId,
      req.params.tenantId,
      body,
      {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    );
  }
}
```

---

## Key Points

1. **Always Pass User Context**
   - userId, userEmail, userName
   - ipAddress (from request.ip)
   - userAgent (from request headers)

2. **Log Before & After**
   - Capture old state before update
   - Include changes in the log
   - This creates a complete audit trail

3. **Handle Errors**
   - Catch exceptions
   - Log failures with error message
   - Set status to 'failure'
   - Then re-throw error

4. **Minimize Data Logged**
   - Don't log passwords, tokens, credit cards
   - Log only business-relevant data
   - Use readable names for entities

5. **Async Logging**
   - Always await audit.log() so it completes
   - Don't block the main operation
   - Consider fire-and-forget for non-critical logs

---

**Status:** ✅ Ready to Copy & Paste  
**Total Examples:** 5 services  
**LOC per Example:** ~40-60 lines
