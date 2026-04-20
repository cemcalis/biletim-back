import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CompanyService } from './company.service';
import {
  CompanyAddTripDto,
  CompanyAddVehicleDto,
  CompanyLoginDto,
  CompanyRegisterDto,
} from './dto/company.dto';
import { CompanyTokenQueryDto } from './dto/company-query.dto';

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
  getOverview(@Query() query: CompanyTokenQueryDto) {
    return this.companyService.getOverview(query.token);
  }

  @Get('vehicles')
  getVehicles(@Query() query: CompanyTokenQueryDto) {
    return this.companyService.getVehicles(query.token);
  }

  @Post('vehicles')
  addVehicle(@Body() body: CompanyAddVehicleDto) {
    return this.companyService.addVehicle(body.token, body);
  }

  @Get('trips')
  getTrips(@Query() query: CompanyTokenQueryDto) {
    return this.companyService.getTrips(query.token);
  }

  @Post('trips')
  addTrip(@Body() body: CompanyAddTripDto) {
    return this.companyService.addTrip(body.token, body);
  }
}
