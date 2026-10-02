import { IsNumber, IsOptional, IsPositive, IsString, Length, Max, Min } from 'class-validator';

export class CreateSettlementDto {
  @IsString()
  @Length(1, 64)
  bookingId: string;

  /** Tenant that sold the booking and collects the guest payment. */
  @IsString()
  @Length(1, 64)
  sellerTenantId: string;

  /** Tenant that owns the inventory. */
  @IsString()
  @Length(1, 64)
  ownerTenantId: string;

  /** Owner's net rate for the whole stay. The guest total is read from the booking, not from the caller. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  ownerNetAmount: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPct: number;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  inventoryVisibilityId?: string;
}

export class MarkPaidDto {
  @IsString()
  @Length(3, 128)
  paymentReference: string;
}
