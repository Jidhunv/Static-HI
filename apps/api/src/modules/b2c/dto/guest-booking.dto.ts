import { IsDateString, IsEmail, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class StayDto {
  @IsString() @MaxLength(100) tenantSlug: string;
  @IsString() @MaxLength(100) propertyId: string;
  @IsString() @MaxLength(100) roomTypeCode: string;
  @IsString() @MaxLength(100) ratePlanCode: string;
  @IsDateString() checkInDate: string;
  @IsDateString() checkOutDate: string;
  @IsInt() @Min(1) @Max(20) adults: number;
  @IsOptional() @IsInt() @Min(0) @Max(20) children?: number;
}

export class CreateGuestBookingDto extends StayDto {
  @IsEmail() @MaxLength(254) guestEmail: string;
  @IsString() @MaxLength(200) guestName: string;
  @IsOptional() @IsString() @MaxLength(40) guestPhone?: string;
  @IsOptional() @IsString() @MaxLength(2000) specialRequests?: string;
}

export class GuestPaymentDto {
  @IsString() @MaxLength(255) @Matches(/^[A-Za-z0-9_]+$/) stripePaymentIntentId: string;
}

export class GuestCancelDto {
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
}
