import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { MFAService } from './mfa.service';
import { CurrentPrincipal, Principal } from './principal';

class MfaCodeDto {
  @IsString()
  @Length(6, 10)
  code: string;
}

@Controller('auth/mfa')
export class MfaController {
  constructor(private mfa: MFAService) {}

  @Post('setup')
  @HttpCode(200)
  setup(@CurrentPrincipal() principal: Principal) {
    return this.mfa.setup(principal);
  }

  @Post('enable')
  @HttpCode(200)
  enable(@CurrentPrincipal() principal: Principal, @Body() dto: MfaCodeDto) {
    return this.mfa.enable(principal, dto.code);
  }

  @Post('disable')
  @HttpCode(200)
  async disable(@CurrentPrincipal() principal: Principal, @Body() dto: MfaCodeDto) {
    await this.mfa.disable(principal, dto.code);
    return { mfaEnabled: false };
  }
}
