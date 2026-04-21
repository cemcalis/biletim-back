import { IsEmail, IsIn, IsInt, IsString, Min, MinLength } from 'class-validator';

export class CompanyRegisterDto {
  @IsString()
  companyName!: string;

  @IsString()
  contactName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class CompanyLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class CompanyAddVehicleDto {
  @IsString()
  token!: string;

  @IsString()
  plate!: string;

  @IsString()
  busType!: string;

  @IsIn(['2+2', '2+1', '1+1'])
  seatLayout!: '2+2' | '2+1' | '1+1';

  @IsInt()
  @Min(4)
  seatRows!: number;
}

export class CompanyAddTripDto {
  @IsString()
  token!: string;

  @IsString()
  from!: string;

  @IsString()
  to!: string;

  @IsString()
  departureDate!: string;

  @IsString()
  arrivalDate!: string;

  @IsString()
  departureTime!: string;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsInt()
  @Min(1)
  price!: number;

  @IsString()
  vehicleId!: string;
}
