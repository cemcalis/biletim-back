import { Controller, Get, Param, Query } from '@nestjs/common';
import { TripsService } from './trips.service';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  getTrips(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('date') date?: string,
  ) {
    return this.tripsService.searchTrips(from, to, date);
  }

  @Get(':tripId/seats')
  getSeats(@Param('tripId') tripId: string) {
    return this.tripsService.getSeats(tripId);
  }
}
