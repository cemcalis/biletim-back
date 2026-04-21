import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
  IsUUID,
  Max,
  Matches,
  ValidateNested,
} from 'class-validator';

export class AdminTokenDto {
  @IsString()
  @Matches(/^ADM-/)
  token!: string;
}

export class AdminTokenQueryDto {
  @IsString()
  @Matches(/^ADM-/)
  token!: string;
}

export class AdminIdParamDto {
  @IsString()
  id!: string;
}

export class AdminCompanyIdParamDto {
  @IsString()
  companyId!: string;
}

export class AdminBookingCodeParamDto {
  @IsString()
  bookingCode!: string;
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
  @IsUUID()
  userId!: string;
}

export class AdminUpdateUserDto extends AdminTokenDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
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

  @IsEmail()
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
  @MinLength(8)
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

export class AdminGetBookingsQueryDto extends AdminTokenQueryDto {
  @IsOptional()
  @IsIn(['Confirmed', 'Completed', 'Canceled'])
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AdminUsersQueryDto extends AdminTokenQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['name', 'email', 'createdAt'])
  sortBy?: 'name' | 'email' | 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsIn(['true', 'false'])
  isCompany?: 'true' | 'false';
}

export class AdminRevenueReportQueryDto extends AdminTokenQueryDto {
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  period!: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AdminExportReportQueryDto extends AdminTokenQueryDto {
  @IsIn(['bookings', 'revenue', 'users'])
  type!: 'bookings' | 'revenue' | 'users';

  @IsIn(['csv', 'json'])
  format!: 'csv' | 'json';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AdminAuditLogsQueryDto extends AdminTokenQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  action?: string;
}

export class AdminPerformanceStatsQueryDto extends AdminTokenQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;
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

export class AdminApproveTripDto extends AdminTokenDto {
  @IsString()
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';
}
