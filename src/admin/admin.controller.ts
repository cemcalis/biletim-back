import {
  AdminAddCompanyDto,
  AdminChangePasswordDto,
  AdminCreateRouteDto,
  AdminCreateTripDto,
  AdminCreateVehicleDto,
  AdminDeleteCompanyDto,
  AdminDeleteUserDto,
  AdminLoginDto,
  AdminTokenDto,
  AdminUpdateBookingStatusDto,
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
  getCompanyRequests(@Query('token') token: string) {
    return this.adminService.getCompanyRequests(token);
  }

  @Patch('company-requests/:companyId/approve')
  approveCompany(
    @Param('companyId') companyId: string,
    @Body() body: AdminTokenDto,
  ) {
    return this.adminService.approveCompany(body.token, companyId);
  }

  @Post('trips')
  createTrip(@Body() body: AdminCreateTripDto) {
    return this.adminService.createTrip(body.token, body.trip);
  }

  @Delete('trips/:id')
  deleteTrip(@Param('id') id: string, @Body() body: AdminTokenDto) {
    return this.adminService.deleteTrip(body.token, id);
  }

  @Get('users')
  getUsers(@Query('token') token: string) {
    return this.adminService.getUsers(token);
  }

  @Post('users/delete')
  deleteUser(@Body() body: AdminDeleteUserDto) {
    return this.adminService.deleteUser(body.token, body.userId);
  }

  @Get('companies')
  getCompanies(@Query('token') token: string) {
    return this.adminService.getCompanies(token);
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
  getRoutes(@Query('token') token: string) {
    return this.adminService.getRoutes(token);
  }

  @Post('routes')
  createRoute(@Body() body: AdminCreateRouteDto) {
    return this.adminService.createRoute(body.token, body.route);
  }

  @Delete('routes/:id')
  deleteRoute(
    @Param('id') id: string,
    @Body() body: AdminTokenDto,
  ) {
    return this.adminService.deleteRoute(body.token, id);
  }

  // Bookings Management
  @Get('bookings')
  getBookings(
    @Query('token') token: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getBookings(token, { status, startDate, endDate });
  }

  @Patch('bookings/:bookingCode/status')
  updateBookingStatus(
    @Param('bookingCode') bookingCode: string,
    @Body() body: AdminUpdateBookingStatusDto,
  ) {
    return this.adminService.updateBookingStatus(body.token, bookingCode, body.status);
  }

  @Delete('bookings/:bookingCode')
  deleteBooking(
    @Param('bookingCode') bookingCode: string,
    @Body() body: AdminTokenDto,
  ) {
    return this.adminService.deleteBooking(body.token, bookingCode);
  }

  // Vehicles Management
  @Get('vehicles')
  getVehicles(@Query('token') token: string) {
    return this.adminService.getVehicles(token);
  }

  @Post('vehicles')
  createVehicle(@Body() body: AdminCreateVehicleDto) {
    return this.adminService.createVehicle(body.token, body.vehicle);
  }

  @Delete('vehicles/:id')
  deleteVehicle(
    @Param('id') id: string,
    @Body() body: AdminTokenDto,
  ) {
    return this.adminService.deleteVehicle(body.token, id);
  }

  // Reports & Analytics
  @Get('reports/revenue')
  getRevenueReport(
    @Query('token') token: string,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getRevenueReport(token, period, startDate, endDate);
  }

  @Get('reports/routes')
  getRouteReport(@Query('token') token: string) {
    return this.adminService.getRouteReport(token);
  }

  @Get('reports/companies')
  getCompanyReport(@Query('token') token: string) {
    return this.adminService.getCompanyReport(token);
  }

  @Get('reports/export')
  exportReport(
    @Query('token') token: string,
    @Query('type') type: 'bookings' | 'revenue' | 'users',
    @Query('format') format: 'csv' | 'json',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.exportReport(token, type, format, startDate, endDate);
  }

  // Audit Logs
  @Get('audit-logs')
  getAuditLogs(
    @Query('token') token: string,
    @Query('limit') limit?: number,
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLogs(token, limit, action);
  }

  // Dashboard Detailed Stats
  @Get('stats/realtime')
  getRealtimeStats(@Query('token') token: string) {
    return this.adminService.getRealtimeStats(token);
  }

  @Get('stats/performance')
  getPerformanceStats(
    @Query('token') token: string,
    @Query('days') days: number = 30,
  ) {
    return this.adminService.getPerformanceStats(token, days);
  }
}
