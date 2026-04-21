import { IsEmail, IsString } from 'class-validator';

export class BookingCodeParamDto {
  @IsString()
  bookingCode!: string;
}

export class GetBookingsQueryDto {
  @IsEmail()
  passengerEmail?: string;
}
