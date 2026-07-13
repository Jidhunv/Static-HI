import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsIn,
  IsEmail,
} from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  name: string;

  @IsString()
  type: string; // Hotel, Resort, etc.

  @IsString()
  countryId: string;

  @IsOptional()
  @IsString()
  stateId?: string;

  @IsString()
  city: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  starCategory?: number;

  @IsOptional()
  @IsString()
  chainName?: string;

  @IsOptional()
  @IsString()
  globalHotelId?: string;

  @IsOptional()
  @IsString()
  checkInTime?: string;

  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  allowEarlyCheckIn?: boolean;

  @IsOptional()
  @IsBoolean()
  allowLateCheckOut?: boolean;

  @IsOptional()
  @IsIn(['yes', 'no'])
  allowChildren?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  usp?: string;

  @IsOptional()
  @IsIn(['private', 'public_b2b', 'public_b2c', 'public_both'])
  visibility?: string;

  @IsOptional()
  @IsIn(['open', 'permissioned'])
  distributionMode?: string;
}

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  usp?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsIn(['private', 'public_b2b', 'public_b2c', 'public_both'])
  visibility?: string;

  @IsOptional()
  @IsIn(['open', 'permissioned'])
  distributionMode?: string;
}
