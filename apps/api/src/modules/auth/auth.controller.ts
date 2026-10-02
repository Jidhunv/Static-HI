import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail, IsObject, IsOptional, IsString } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../shared/security/access.decorators';

// Per IP address: slows password guessing and mass sign-ups.
const LOGIN_LIMIT = { short: { limit: 5, ttl: 60000 }, long: { limit: 30, ttl: 3600000 } };

// Every field needs a decorator: the global ValidationPipe rejects undeclared properties.
class AdminLoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

class OnboardDto {
  @IsString() tenantId: string;
  @IsString() name: string;
  @IsString() businessType: string;
  @IsEmail() adminEmail: string;
  @IsString() adminPassword: string;
  @IsString() country: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() area?: string;
  @IsOptional() @IsString() strengths?: string;
  @IsOptional() @IsString() profileDescription?: string;
  @IsOptional() @IsObject() salesContact?: { name: string; phone: string; email: string };
  @IsOptional() @IsObject() financeContact?: { name: string; phone: string; email: string };
  @IsOptional() @IsObject() owner?: { name: string; phone: string; email: string };
  @IsOptional() @IsString() documentUrl?: string;
}

@Public()
@Throttle(LOGIN_LIMIT)
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
