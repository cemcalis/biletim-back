import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class AdminTokenDto {
  @IsString()
  token!: string;
}

export class AdminLoginDto {
  @IsString()
  username!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsIn(['super-admin', 'company-admin'])
  role?: 'super-admin' | 'company-admin';
}

export class AdminDeleteUserDto extends AdminTokenDto {
  @IsString()
  userId!: string;
}

export class AdminDeleteCompanyDto extends AdminTokenDto {
  @IsString()
  companyId!: string;
}

class AdminCompanyPayloadDto {
  @IsString()
  companyName!: string;

  @IsString()
  contactName!: string;

  @IsString()
  email!: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class AdminAddCompanyDto extends AdminTokenDto {
  @ValidateNested()
  @Type(() => AdminCompanyPayloadDto)
  company!: AdminCompanyPayloadDto;
}

export class AdminChangePasswordDto extends AdminTokenDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}

export class AdminCreateTripDto extends AdminTokenDto {
  @IsObject()
  trip!: Record<string, unknown>;
}

class AdminRoutePayloadDto {
  @IsString()
  from!: string;

  @IsString()
  to!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  basePrice!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMinutes!: number;
}

export class AdminCreateRouteDto extends AdminTokenDto {
  @ValidateNested()
  @Type(() => AdminRoutePayloadDto)
  route!: AdminRoutePayloadDto;
}

export class AdminUpdateBookingStatusDto extends AdminTokenDto {
  @IsString()
  @IsIn(['Confirmed', 'Completed', 'Canceled'])
  status!: string;
}

class AdminVehiclePayloadDto {
  @IsString()
  plate!: string;

  @IsString()
  busType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  seatsTotal!: number;

  @IsIn(['2+2', '2+1', '1+1'])
  seatLayout!: '2+2' | '2+1' | '1+1';

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class AdminCreateVehicleDto extends AdminTokenDto {
  @ValidateNested()
  @Type(() => AdminVehiclePayloadDto)
  vehicle!: AdminVehiclePayloadDto;
}
