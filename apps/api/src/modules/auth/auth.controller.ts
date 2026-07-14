import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('admin-login')
  @HttpCode(200)
  async adminLogin(@Body() body: { email: string; password: string }) {
    return this.authService.adminLogin(body.email, body.password);
  }

  @Post('onboard')
  @HttpCode(201)
  async onboard(@Body() body: {
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
    return this.authService.onboard(
      body.tenantId,
      body.name,
      body.businessType,
      body.adminEmail,
      body.adminPassword,
      body.country,
      body.city,
      body.area,
      body.strengths,
      body.profileDescription,
      body.salesContact,
      body.financeContact,
      body.owner,
      body.documentUrl
    );
  }
}
