import {
  AdminAddCompanyDto,
  AdminAuditLogsQueryDto,
  AdminBookingCodeParamDto,
  AdminChangePasswordDto,
  AdminCompanyIdParamDto,
  AdminCreateRouteDto,
  AdminCreateTripDto,
  AdminCreateVehicleDto,
  AdminDeleteCompanyDto,
  AdminDeleteUserDto,
  AdminExportReportQueryDto,
  AdminGetBookingsQueryDto,
  AdminIdParamDto,
  AdminLoginDto,
  AdminPerformanceStatsQueryDto,
  AdminRevenueReportQueryDto,
  AdminTokenDto,
  AdminTokenQueryDto,
  AdminUpdateBookingStatusDto,
  AdminUsersQueryDto,
} from './dto/admin.dto';
import {
  Body,
  Controller,
  Delete,
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
  login(@Body() body: AdminLoginDto) {
    return this.adminService.login(body);
  }

  @Get('company-requests')
  getCompanyRequests(@Query() query: AdminTokenQueryDto) {
    return this.adminService.getCompanyRequests(query.token);
  }

  @Patch('company-requests/:companyId/approve')
  approveCompany(
    @Param() params: AdminCompanyIdParamDto,
    @Body() body: AdminTokenDto,
  ) {
    return this.adminService.approveCompany(body.token, params.companyId);
  }

  @Post('trips')
  createTrip(@Body() body: AdminCreateTripDto) {
    return this.adminService.createTrip(body.token, body.trip);
  }

  @Get('trips')
  getTrips(@Query() query: AdminTokenQueryDto) {
    return this.adminService.getTrips(query.token);
  }

  @Delete('trips/:id')
  deleteTrip(@Param() params: AdminIdParamDto, @Body() body: AdminTokenDto) {
    return this.adminService.deleteTrip(body.token, params.id);
  }

  @Get('users')
  getUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.getUsers(query.token, query);
  }

  @Post('users/delete')
  deleteUser(@Body() body: AdminDeleteUserDto) {
    return this.adminService.deleteUser(body.token, body.userId);
  }

  @Get('companies')
  getCompanies(@Query() query: AdminTokenQueryDto) {
    return this.adminService.getCompanies(query.token);
  }

  @Post('companies')
  addCompany(@Body() body: AdminAddCompanyDto) {
    return this.adminService.addCompany(body.token, body.company);
  }

  @Post('companies/delete')
  deleteCompany(@Body() body: AdminDeleteCompanyDto) {
    return this.adminService.deleteCompany(body.token, body.companyId);
  }

  @Patch('password')
  changePassword(@Body() body: AdminChangePasswordDto) {
    return this.adminService.changeAdminPassword(
      body.token,
      body.currentPassword,
      body.newPassword,
    );
  }

  // Routes Management
  @Get('routes')
  getRoutes(@Query() query: AdminTokenQueryDto) {
    return this.adminService.getRoutes(query.token);
  }

  @Post('routes')
  createRoute(@Body() body: AdminCreateRouteDto) {
    return this.adminService.createRoute(body.token, body.route);
  }

  @Delete('routes/:id')
  deleteRoute(@Param() params: AdminIdParamDto, @Body() body: AdminTokenDto) {
    return this.adminService.deleteRoute(body.token, params.id);
  }

  // Bookings Management
  @Get('bookings')
  getBookings(@Query() query: AdminGetBookingsQueryDto) {
    const { token, status, startDate, endDate } = query;
    return this.adminService.getBookings(token, { status, startDate, endDate });
  }

  @Patch('bookings/:bookingCode/status')
  updateBookingStatus(
    @Param() params: AdminBookingCodeParamDto,
    @Body() body: AdminUpdateBookingStatusDto,
  ) {
    return this.adminService.updateBookingStatus(
      body.token,
      params.bookingCode,
      body.status,
    );
  }

  @Delete('bookings/:bookingCode')
  deleteBooking(
    @Param() params: AdminBookingCodeParamDto,
    @Body() body: AdminTokenDto,
  ) {
    return this.adminService.deleteBooking(body.token, params.bookingCode);
  }

  // Vehicles Management
  @Get('vehicles')
  getVehicles(@Query() query: AdminTokenQueryDto) {
    return this.adminService.getVehicles(query.token);
  }

  @Post('vehicles')
  createVehicle(@Body() body: AdminCreateVehicleDto) {
    return this.adminService.createVehicle(body.token, body.vehicle);
  }

  @Delete('vehicles/:id')
  deleteVehicle(@Param() params: AdminIdParamDto, @Body() body: AdminTokenDto) {
    return this.adminService.deleteVehicle(body.token, params.id);
  }

  // Reports & Analytics
  @Get('reports/revenue')
  getRevenueReport(@Query() query: AdminRevenueReportQueryDto) {
    return this.adminService.getRevenueReport(
      query.token,
      query.period,
      query.startDate,
      query.endDate,
    );
  }

  @Get('reports/routes')
  getRouteReport(@Query() query: AdminTokenQueryDto) {
    return this.adminService.getRouteReport(query.token);
  }

  @Get('reports/companies')
  getCompanyReport(@Query() query: AdminTokenQueryDto) {
    return this.adminService.getCompanyReport(query.token);
  }

  @Get('reports/export')
  exportReport(@Query() query: AdminExportReportQueryDto) {
    return this.adminService.exportReport(
      query.token,
      query.type,
      query.format,
      query.startDate,
      query.endDate,
    );
  }

  // Audit Logs
  @Get('audit-logs')
  getAuditLogs(@Query() query: AdminAuditLogsQueryDto) {
    return this.adminService.getAuditLogs(
      query.token,
      query.limit,
      query.action,
    );
  }

  // Dashboard Detailed Stats
  @Get('stats/realtime')
  getRealtimeStats(@Query() query: AdminTokenQueryDto) {
    return this.adminService.getRealtimeStats(query.token);
  }

  @Get('stats/performance')
  getPerformanceStats(@Query() query: AdminPerformanceStatsQueryDto) {
    return this.adminService.getPerformanceStats(query.token, query.days ?? 30);
  }
}
