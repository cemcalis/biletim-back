import { IsEmail, IsOptional, IsString } from 'class-validator';

export class BookingCodeParamDto {
  @IsString()
  bookingCode!: string;
}

export class GetBookingsQueryDto {
  @IsOptional()
  @IsEmail()
  passengerEmail?: string;
}
