import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ArrayMinSize,
  IsArray,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  tripId!: string;

  @IsString()
  passengerName!: string;

  @IsEmail()
  passengerEmail!: string;

  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/)
  passengerPhone!: string;

  @IsOptional()
  @IsString()
  holderId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Matches(/^([A-Z]+\d+|\d+[A-Z]+)$/i, { each: true })
  seatNumbers?: string[];

  @IsOptional()
  @IsString()
  @Matches(/^([A-Z]+\d+|\d+[A-Z]+)$/i)
  seatNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  passengers?: number;

  @IsOptional()
  @IsString()
  travelDate?: string;
}
