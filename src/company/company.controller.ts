import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CompanyService } from './company.service';
import {
  CompanyAddTripDto,
  CompanyAddVehicleDto,
  CompanyLoginDto,
  CompanyRegisterDto,
} from './dto/company.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('register')
  register(@Body() body: CompanyRegisterDto) {
    return this.companyService.register(body);
  }

  @Post('login')
  login(@Body() body: CompanyLoginDto) {
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
  addVehicle(@Body() body: CompanyAddVehicleDto) {
    return this.companyService.addVehicle(body.token, body);
  }

  @Get('trips')
  getTrips(@Query('token') token: string) {
    return this.companyService.getTrips(token);
  }

  @Post('trips')
  addTrip(@Body() body: CompanyAddTripDto) {
    return this.companyService.addTrip(body.token, body);
  }
}
