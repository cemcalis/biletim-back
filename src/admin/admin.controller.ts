import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminRole, Trip } from '../common/types';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Post('login')
  login(@Body() body: { username: string; password: string; role?: AdminRole }) {
    return this.adminService.login(body);
  }

  @Get('company-requests')
  getCompanyRequests(@Query('token') token: string) {
    return this.adminService.getCompanyRequests(token);
  }

  @Patch('company-requests/:companyId/approve')
  approveCompany(
    @Param('companyId') companyId: string,
    @Body() body: { token: string },
  ) {
    return this.adminService.approveCompany(body.token, companyId);
  }

  @Post('trips')
  createTrip(@Body() body: { token: string; trip: Partial<Trip> }) {
    return this.adminService.createTrip(body.token, body.trip);
  }

  @Delete('trips/:id')
  deleteTrip(@Param('id') id: string, @Body() body: { token: string }) {
    return this.adminService.deleteTrip(body.token, id);
  }
}
