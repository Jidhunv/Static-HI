import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional, IsPhoneNumber, IsUrl } from 'class-validator';

export class EmailDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}

export class PasswordDto {
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;
}

export class ContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsPhoneNumber('US', { message: 'Invalid phone number' })
  phone: string;

  @IsEmail()
  email: string;
}

export class AddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  city: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  state: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  area?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  country: string;
}

export class PropertyBaseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('US')
  phone: string;

  @IsUrl()
  @IsOptional()
  website?: string;
}