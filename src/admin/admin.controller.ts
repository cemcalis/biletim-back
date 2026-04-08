import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
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
}
