import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  getBookings(@Query('passengerEmail') passengerEmail?: string) {
    return this.bookingsService.getBookings(passengerEmail);
  }

  @Get(':bookingCode')
  getByCode(@Param('bookingCode') bookingCode: string) {
    return this.bookingsService.getBookingByCode(bookingCode);
  }

  @Get(':bookingCode/ticket')
  getTicket(@Param('bookingCode') bookingCode: string) {
    return this.bookingsService.getBookingTicket(bookingCode);
  }

  @Patch(':bookingCode/cancel')
  cancel(@Param('bookingCode') bookingCode: string) {
    return this.bookingsService.cancelBooking(bookingCode);
  }

  @Post()
  create(
    @Body()
    body: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(body);
  }
}
