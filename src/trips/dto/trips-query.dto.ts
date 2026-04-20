import { IsOptional, IsString } from 'class-validator';

export class SearchTripsQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  date?: string;
}

export class TripIdParamDto {
  @IsString()
  tripId!: string;
}
