import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CompanyService } from './company.service';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('register')
  register(
    @Body()
    body: {
      companyName: string;
      contactName: string;
      email: string;
      password: string;
    },
  ) {
    return this.companyService.register(body);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.companyService.login(body);
  }

  @Get('overview')
  getOverview(@Query('token') token: string) {
    return this.companyService.getOverview(token);
  }

  @Get('vehicles')
  getVehicles(@Query('token') token: string) {
    return this.companyService.getVehicles(token);
  }

  @Post('vehicles')
  addVehicle(
    @Body()
    body: {
      token: string;
      plate: string;
      busType: string;
      seatLayout: '2+2' | '2+1' | '1+1';
      seatRows: number;
    },
  ) {
    return this.companyService.addVehicle(body.token, body);
  }

  @Get('trips')
  getTrips(@Query('token') token: string) {
    return this.companyService.getTrips(token);
  }

  @Post('trips')
  addTrip(
    @Body()
    body: {
      token: string;
      from: string;
      to: string;
      departureDate: string;
      arrivalDate: string;
      departureTime: string;
      durationMinutes: number;
      price: number;
      vehicleId: string;
    },
  ) {
    return this.companyService.addTrip(body.token, body);
  }
}
