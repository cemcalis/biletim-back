import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserAuthGuard } from '../auth/user-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  BookingCodeParamDto,
  GetBookingsQueryDto,
} from './dto/bookings-query.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(UserAuthGuard)
  @Get()
  getBookings(
    @Query() query: GetBookingsQueryDto,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    return this.bookingsService.getBookings(query.passengerEmail ?? user.email);
  }

  @UseGuards(UserAuthGuard)
  @Get(':bookingCode')
  getByCode(@Param() params: BookingCodeParamDto) {
    return this.bookingsService.getBookingByCode(params.bookingCode);
  }

  @UseGuards(UserAuthGuard)
  @Get(':bookingCode/ticket')
  getTicket(@Param() params: BookingCodeParamDto) {
    return this.bookingsService.getBookingTicket(params.bookingCode);
  }

  @UseGuards(UserAuthGuard)
  @Patch(':bookingCode/cancel')
  cancel(@Param() params: BookingCodeParamDto) {
    return this.bookingsService.cancelBooking(params.bookingCode);
  }

  @Post()
  create(
    @Body()
    body: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(body);
  }
}
