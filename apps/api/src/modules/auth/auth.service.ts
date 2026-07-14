import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantId },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid tenant');
    }

    const user = await this.prisma.tenantUser.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: dto.email } },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is inactive');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      tenant_id: user.tenantId,
      role: user.role,
      permissions: user.permissions,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        role: user.role,
      },
    };
  }

  async adminLogin(email: string, password: string) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (admin.status !== 'active') {
      throw new UnauthorizedException('Admin account is inactive');
    }

    const token = this.jwtService.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      type: 'admin',
    });

    return {
      access_token: token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  async onboard(
    tenantId: string,
    name: string,
    businessType: string,
    adminEmail: string,
    adminPassword: string,
    country: string,
    city?: string,
    area?: string,
    strengths?: string,
    profileDescription?: string,
    salesContact?: { name: string; phone: string; email: string },
    financeContact?: { name: string; phone: string; email: string },
    owner?: { name: string; phone: string; email: string },
    documentUrl?: string,
  ) {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantId },
    });

    if (existingTenant) {
      throw new BadRequestException('Tenant ID already exists');
    }

    const existingUser = await this.prisma.tenantUser.findUnique({
      where: { tenantId_email: { tenantId, email: adminEmail } },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const tenant = await this.prisma.tenant.create({
      data: {
        slug: tenantId,
        name,
        businessType,
        status: 'pending',
        primaryCurrency: 'USD',
        country,
        city,
        area,
        metadata: {
          strengths,
          profileDescription,
          salesContact,
          financeContact,
          owner,
          documentUrl,
        },
        users: {
          create: {
            email: adminEmail,
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            status: 'active',
          },
        },
      },
    });

    return {
      tenantId: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
      message: 'Tenant created successfully. Please wait for approval.',
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
