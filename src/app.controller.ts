import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('routes')
  getRoutes() {
    return this.appService.getRoutes();
  }

  @Get('admin/overview')
  getAdminOverview() {
    return this.appService.getAdminOverview();
  }

  @Post('admin/login')
  adminLogin(@Body() body: { username: string; password: string }) {
    return this.appService.adminLogin(body);
  }

  @Get('admin/company-requests')
  getCompanyRequests(@Query('token') token: string) {
    return this.appService.getCompanyRequests(token);
  }

  @Patch('admin/company-requests/:companyId/approve')
  approveCompany(
    @Param('companyId') companyId: string,
    @Body() body: { token: string },
  ) {
    return this.appService.approveCompany(body.token, companyId);
  }

  @Post('company/register')
  companyRegister(
    @Body()
    body: {
      companyName: string;
      contactName: string;
      email: string;
      password: string;
    },
  ) {
    return this.appService.companyRegister(body);
  }

  @Post('company/login')
  companyLogin(@Body() body: { email: string; password: string }) {
    return this.appService.companyLogin(body);
  }

  @Get('company/overview')
  getCompanyOverview(@Query('token') token: string) {
    return this.appService.getCompanyOverview(token);
  }

  @Get('company/vehicles')
  getCompanyVehicles(@Query('token') token: string) {
    return this.appService.getCompanyVehicles(token);
  }

  @Post('company/vehicles')
  addCompanyVehicle(
    @Body()
    body: {
      token: string;
      plate: string;
      busType: string;
      seatsTotal: number;
    },
  ) {
    return this.appService.addCompanyVehicle(body.token, body);
  }

  @Get('company/trips')
  getCompanyTrips(@Query('token') token: string) {
    return this.appService.getCompanyTrips(token);
  }

  @Post('company/trips')
  addCompanyTrip(
    @Body()
    body: {
      token: string;
      from: string;
      to: string;
      departureTime: string;
      durationMinutes: number;
      price: number;
      busType: string;
      seatsTotal: number;
    },
  ) {
    return this.appService.addCompanyTrip(body.token, body);
  }

  @Get('trips')
  getTrips(@Query('from') from?: string, @Query('to') to?: string) {
    return this.appService.searchTrips(from, to);
  }

  @Get('trips/:tripId/seats')
  getTripSeats(@Param('tripId') tripId: string) {
    return this.appService.getSeats(tripId);
  }

  @Get('bookings')
  getBookings(@Query('passengerEmail') passengerEmail?: string) {
    return this.appService.getBookings(passengerEmail);
  }

  @Get('bookings/:bookingCode')
  getBookingByCode(@Param('bookingCode') bookingCode: string) {
    return this.appService.getBookingByCode(bookingCode);
  }

  @Get('bookings/:bookingCode/ticket')
  getBookingTicket(@Param('bookingCode') bookingCode: string) {
    return this.appService.getBookingTicket(bookingCode);
  }

  @Patch('bookings/:bookingCode/cancel')
  cancelBooking(@Param('bookingCode') bookingCode: string) {
    return this.appService.cancelBooking(bookingCode);
  }

  @Post('bookings')
  createBooking(
    @Body()
    body: {
      tripId: string;
      passengerName: string;
      passengerEmail: string;
      seatNumber: string;
      passengers?: number;
      travelDate?: string;
    },
  ) {
    return this.appService.createBooking(body);
  }
}
