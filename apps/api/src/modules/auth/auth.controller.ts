import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

class AdminLoginDto {
  email: string;
  password: string;
}

class OnboardDto {
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
}

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
  async adminLogin(@Body() { email, password }: AdminLoginDto) {
    return this.authService.adminLogin(email, password);
  }

  @Post('onboard')
  @HttpCode(201)
  async onboard(@Body() dto: OnboardDto) {
    return this.authService.onboard(dto);
  }
}
