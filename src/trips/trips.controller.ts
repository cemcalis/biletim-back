import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { SearchTripsQueryDto, TripIdParamDto } from './dto/trips-query.dto';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  getTrips(@Query() query: SearchTripsQueryDto) {
    return this.tripsService.searchTrips(query.from, query.to, query.date);
  }

  @Get(':tripId/seats')
  getSeats(@Param() params: TripIdParamDto) {
    return this.tripsService.getSeats(params.tripId);
  }

  @Post(':tripId/seats/:seatNumber/hold')
  holdSeat(
    @Param('tripId') tripId: string,
    @Param('seatNumber') seatNumber: string,
    @Body('holderId') holderId?: string,
  ) {
    return this.tripsService.holdSeat(tripId, seatNumber, holderId);
  }

  @Delete(':tripId/seats/:seatNumber/hold')
  releaseSeat(
    @Param('tripId') tripId: string,
    @Param('seatNumber') seatNumber: string,
    @Body('holderId') holderId?: string,
  ) {
    return this.tripsService.releaseSeat(tripId, seatNumber, holderId);
  }
}
