import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  tripId!: string;

  @IsString()
  passengerName!: string;

  @IsEmail()
  passengerEmail!: string;

  @IsString()
  @Matches(/^\d+[A-Z]$/i)
  seatNumber!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  passengers?: number;

  @IsOptional()
  @IsString()
  travelDate?: string;
}
