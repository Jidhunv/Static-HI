import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
// Compared against when the account does not exist, so a miss takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync('no-such-account', BCRYPT_ROUNDS);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private validatePassword(password: string): void {
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      throw new BadRequestException('Password must contain uppercase and numeric characters');
    }
  }

  private async verifyPassword(plainPassword: string, hashedPassword?: string): Promise<boolean> {
    const matches = await bcrypt.compare(plainPassword, hashedPassword ?? DUMMY_HASH);
    return matches && !!hashedPassword;
  }

  private async hashPassword(password: string): Promise<string> {
    this.validatePassword(password);
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  private buildTokenPayload(user: { id: string; email: string; role: string; permissions?: any }, type?: string) {
    return { sub: user.id, email: user.email, role: user.role, type, permissions: user.permissions || [] };
  }

  async login(dto: LoginDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantId } });
    const user = tenant
      ? await this.prisma.tenantUser.findUnique({
          where: { tenantId_email: { tenantId: tenant.id, email: dto.email } },
          include: { tenant: true },
        })
      : null;

    if (!(await this.verifyPassword(dto.password, user?.password)) || !user) {
      this.logger.warn(`Failed login for user: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') throw new UnauthorizedException('User account is inactive');
    if (user.tenant.status !== 'active') throw new UnauthorizedException('This organisation is not active yet');

    const token = this.jwtService.sign(this.buildTokenPayload(user));
    this.logger.log(`User logged in: ${user.email}`);

    return {
      access_token: token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, tenantId: user.tenantId, tenantName: user.tenant.name, role: user.role },
    };
  }

  async adminLogin(email: string, password: string) {
    const admin = await this.prisma.platformAdmin.findUnique({ where: { email } });
    if (!(await this.verifyPassword(password, admin?.password)) || !admin) {
      this.logger.warn(`Failed admin login for: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (admin.status !== 'active') throw new UnauthorizedException('Admin account is inactive');

    const token = this.jwtService.sign(this.buildTokenPayload(admin, 'admin'));
    this.logger.log(`Admin logged in: ${email}`);

    return { access_token: token, user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } };
  }

  async onboard(data: {
    tenantId: string;
    name: string;
    businessType: string;
    adminEmail: string;
    adminPassword: string;
    country: string;
    city?: string;
    area?: string;
    strengths?: string;
    profileDescription?: string;
    salesContact?: { name: string; phone: string; email: string };
    financeContact?: { name: string; phone: string; email: string };
    owner?: { name: string; phone: string; email: string };
    documentUrl?: string;
  }) {
    const [existingTenant, existingUser] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { slug: data.tenantId } }),
      this.prisma.tenantUser.findUnique({ where: { tenantId_email: { tenantId: data.tenantId, email: data.adminEmail } } }),
    ]);

    if (existingTenant) throw new BadRequestException('Tenant ID already exists');
    if (existingUser) throw new BadRequestException('Email already registered');

    const hashedPassword = await this.hashPassword(data.adminPassword);

    const tenant = await this.prisma.tenant.create({
      data: {
        slug: data.tenantId,
        name: data.name,
        businessType: data.businessType,
        status: 'pending',
        primaryCurrency: 'USD',
        users: {
          create: {
            email: data.adminEmail,
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            status: 'active',
          },
        },
      },
    });

    this.logger.log(`New tenant created: ${tenant.id}`);
    return { tenantId: tenant.id, slug: tenant.slug, name: tenant.name, status: tenant.status, message: 'Tenant created successfully. Please wait for approval.' };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      this.logger.warn(`Invalid token validation attempt`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
