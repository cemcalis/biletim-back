import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataStoreService } from '../common/data/data-store.service';
import { AdminRole, Trip } from '../common/types';
import { User } from '../database/entities/user.entity';

const accessRules: Record<string, AdminRole[]> = {
  companyRequests: ['super-admin'],
  approveCompany: ['super-admin'],
  manageTrips: ['super-admin', 'company-admin'],
};

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly dataStore: DataStoreService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  login(input: { username: string; password: string; role?: AdminRole }) {
    const username = input.username?.trim();
    const password = input.password?.trim();
    const role = input.role ?? 'super-admin';
    const adminCredentials = this.dataStore.getAdminCredentials();

    if (
      username !== adminCredentials.username ||
      password !== adminCredentials.password
    ) {
      this.logger.warn(
        `Admin login failed for username="${username ?? 'unknown'}" role="${role}"`,
      );
      return { ok: false, message: 'Yonetici giris bilgileri hatali' };
    }

    const token = this.dataStore.addAdminSession(role);
    this.logger.log(
      `Admin login success for username="${username}" role="${role}"`,
    );
    return { ok: true, token, role };
  }

  getCompanyRequests(adminToken: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }

    const db = this.dataStore.readData();
    return {
      ok: true,
      requests: db.companies
        .filter((item) => item.status === 'pending')
        .map((item) => ({
          id: item.id,
          companyName: item.companyName,
          contactName: item.contactName,
          email: item.email,
          createdAt: item.createdAt,
        })),
    };
  }

  approveCompany(adminToken: string, companyId: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.approveCompany)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }

    const db = this.dataStore.readData();
    const company = db.companies.find((item) => item.id === companyId);
    if (!company) {
      return { ok: false, message: 'Firma bulunamadi' };
    }

    company.status = 'approved';
    company.approvedAt = new Date().toISOString();
    this.dataStore.saveData(db);
    return { ok: true };
  }

  getUsers(adminToken: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }

    return this.userRepository.find({
      select: ['id', 'name', 'email', 'isCompany', 'createdAt'],
    }).then((users) => ({ ok: true, users }));
  }

  deleteUser(adminToken: string, userId: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }

    return this.userRepository.delete({ id: userId }).then(({ affected }) => {
      if (!affected) {
        return { ok: false, message: 'Kullanici bulunamadi' };
      }
      return { ok: true };
    });
  }

  getCompanies(adminToken: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }

    const db = this.dataStore.readData();
    return { ok: true, companies: db.companies };
  }

  addCompany(adminToken: string, companyData: Partial<{ companyName: string; contactName: string; email: string; password: string; }>) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }

    const db = this.dataStore.readData();
    const id = `CMP-${Date.now().toString().slice(-4)}`;
    const newCompany = {
      id,
      companyName: companyData.companyName?.trim() || 'Yeni Firma',
      contactName: companyData.contactName?.trim() || 'Yonetici',
      email: companyData.email?.trim().toLowerCase() || `company-${id}@neareast.local`,
      password: companyData.password?.trim() || 'Company123!',
      status: 'approved' as const,
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    };

    db.companies.push(newCompany);
    this.dataStore.saveData(db);
    return { ok: true, company: newCompany };
  }

  deleteCompany(adminToken: string, companyId: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }

    const db = this.dataStore.readData();
    db.companies = db.companies.filter((item) => item.id !== companyId);
    db.trips = db.trips.filter((trip) => trip.companyId !== companyId);
    this.dataStore.saveData(db);
    return { ok: true };
  }

  changeAdminPassword(adminToken: string, currentPassword: string, newPassword: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }

    const credentials = this.dataStore.getAdminCredentials();
    if (credentials.password !== currentPassword) {
      return { ok: false, message: 'Mevcut sifre hatali' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { ok: false, message: 'Yeni sifre en az 6 karakter olmalidir' };
    }

    this.dataStore.updateAdminPassword(newPassword);
    return { ok: true };
  }

  createTrip(adminToken: string, tripData: Partial<Trip>) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.manageTrips)) {
      return { ok: false, message: 'Yetkisiz islem' };
    }

    const db = this.dataStore.readData();
    const approvedCompany = db.companies.find((item) => item.status === 'approved') ?? db.companies[0];
    
    const newTrip: Trip = {
      id: `TRP-${Date.now().toString().slice(-4)}`,
      tripCode: tripData.tripCode ?? `EXP-${Math.floor(Math.random()*1000)}`,
      companyId: approvedCompany?.id ?? 'CMP-0000',
      company: tripData.company ?? 'Near East Way Seferleri',
      from: tripData.from ?? 'Ankara',
      to: tripData.to ?? 'İstanbul',
      departureDate: tripData.departureDate ?? new Date().toISOString().slice(0, 10),
      arrivalDate: tripData.arrivalDate ?? new Date().toISOString().slice(0, 10),
      departureTime: tripData.departureTime ?? '12:00',
      durationMinutes: tripData.durationMinutes ?? 120,
      price: tripData.price ?? 500,
      busType: tripData.busType ?? 'Standart',
      rating: tripData.rating ?? 5.0,
      seatsTotal: tripData.seatsTotal ?? 40,
      seatLayout: tripData.seatLayout ?? '2+2',
      isActive: true
    };

    db.trips.push(newTrip);
    this.dataStore.saveData(db);
    return { ok: true, trip: newTrip };
  }

  deleteTrip(adminToken: string, tripId: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.manageTrips)) {
      return { ok: false, message: 'Yetkisiz islem' };
    }

    const db = this.dataStore.readData();
    const tripIndex = db.trips.findIndex(t => t.id === tripId);
    if (tripIndex === -1) return { ok: false, message: 'Sefer bulunamadı' };
    
    db.trips.splice(tripIndex, 1);
    this.dataStore.saveData(db);
    return { ok: true };
  }

  getOverview() {
    const db = this.dataStore.readData();
    const bookings = db.bookings;
    const confirmedOrCompleted = bookings.filter(
      (item) => item.status !== 'Canceled',
    );
    const revenue = confirmedOrCompleted.reduce(
      (sum, booking) => sum + booking.totalPrice,
      0,
    );
    const activeUsers = new Set(bookings.map((item) => item.passengerEmail))
      .size;

    const monthFormatter = new Intl.DateTimeFormat('tr-TR', { month: 'short' });
    const now = new Date();
    const revenueTrend = Array.from({ length: 6 }, (_, offset) => {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - (5 - offset),
        1,
      );
      const label = monthFormatter.format(monthDate);
      const monthValue = confirmedOrCompleted
        .filter((booking) => {
          const bookingDate = new Date(booking.createdAt);
          return (
            bookingDate.getMonth() === monthDate.getMonth() &&
            bookingDate.getFullYear() === monthDate.getFullYear()
          );
        })
        .reduce((sum, booking) => sum + booking.totalPrice, 0);

      return {
        month: label,
        value: monthValue,
      };
    });

    const routeCounts = new Map<string, number>();
    confirmedOrCompleted.forEach((booking) => {
      routeCounts.set(booking.route, (routeCounts.get(booking.route) ?? 0) + 1);
    });

    const popularRoutes = Array.from(routeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([route, count], index) => {
        const colors = ['#1d7fe6', '#15b8a6', '#f7b928', '#ff8743', '#8682d5'];
        const percentage = confirmedOrCompleted.length
          ? Math.round((count / confirmedOrCompleted.length) * 100)
          : 0;

        return {
          label: route.replace(' - ', '-'),
          value: percentage,
          color: colors[index % colors.length],
        };
      });

    return {
      metrics: {
        totalBookings: bookings.length,
        activeUsers,
        busRoutes: db.routes.length,
        revenue,
        growth: {
          bookings: 0,
          activeUsers: 0,
          busRoutes: 0,
          revenue: 0,
        },
      },
      revenueTrend,
      popularRoutes,
      recentBookings: bookings.slice(0, 10),
    };
  }

  // Routes Management
  getRoutes(adminToken: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    const db = this.dataStore.readData();
    return { ok: true, routes: db.routes };
  }

  createRoute(adminToken: string, routeData: { from: string; to: string; basePrice: number; durationMinutes: number }) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    const db = this.dataStore.readData();
    const newRoute = {
      from: routeData.from?.trim() || '',
      to: routeData.to?.trim() || '',
      basePrice: routeData.basePrice || 100,
      durationMinutes: routeData.durationMinutes || 60,
    };
    db.routes.push(newRoute);
    this.dataStore.saveData(db);
    this.logAudit(adminToken, 'CREATE_ROUTE', `Created route ${newRoute.from} -> ${newRoute.to}`);
    return { ok: true, route: newRoute };
  }

  deleteRoute(adminToken: string, routeId: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    const db = this.dataStore.readData();
    const index = parseInt(routeId);
    if (isNaN(index) || index < 0 || index >= db.routes.length) {
      return { ok: false, message: 'Guzergah bulunamadi' };
    }
    const deleted = db.routes.splice(index, 1)[0];
    this.dataStore.saveData(db);
    this.logAudit(adminToken, 'DELETE_ROUTE', `Deleted route ${deleted.from} -> ${deleted.to}`);
    return { ok: true };
  }

  // Bookings Management
  getBookings(adminToken: string, filters?: { status?: string; startDate?: string; endDate?: string }) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    const db = this.dataStore.readData();
    let bookings = db.bookings;
    
    if (filters?.status) {
      bookings = bookings.filter(b => b.status === filters.status);
    }
    if (filters?.startDate) {
      bookings = bookings.filter(b => new Date(b.createdAt) >= new Date(filters.startDate!));
    }
    if (filters?.endDate) {
      bookings = bookings.filter(b => new Date(b.createdAt) <= new Date(filters.endDate!));
    }
    
    return { ok: true, bookings: bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
  }

  updateBookingStatus(adminToken: string, bookingCode: string, status: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.manageTrips)) {
      return { ok: false, message: 'Yetkisiz islem' };
    }
    const db = this.dataStore.readData();
    const booking = db.bookings.find(b => b.bookingCode === bookingCode);
    if (!booking) {
      return { ok: false, message: 'Rezervasyon bulunamadi' };
    }
    const validStatuses = ['Confirmed', 'Completed', 'Canceled'];
    if (!validStatuses.includes(status)) {
      return { ok: false, message: 'Gecersiz durum' };
    }
    booking.status = status as any;
    this.dataStore.saveData(db);
    this.logAudit(adminToken, 'UPDATE_BOOKING', `Updated booking ${bookingCode} status to ${status}`);
    return { ok: true, booking };
  }

  deleteBooking(adminToken: string, bookingCode: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    const db = this.dataStore.readData();
    const index = db.bookings.findIndex(b => b.bookingCode === bookingCode);
    if (index === -1) {
      return { ok: false, message: 'Rezervasyon bulunamadi' };
    }
    db.bookings.splice(index, 1);
    this.dataStore.saveData(db);
    this.logAudit(adminToken, 'DELETE_BOOKING', `Deleted booking ${bookingCode}`);
    return { ok: true };
  }

  // Vehicles Management
  getVehicles(adminToken: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    const db = this.dataStore.readData();
    return { ok: true, vehicles: db.vehicles };
  }

  createVehicle(adminToken: string, vehicleData: { plate: string; busType: string; seatsTotal: number; seatLayout: '2+2' | '2+1' | '1+1'; companyId?: string }) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.manageTrips)) {
      return { ok: false, message: 'Yetkisiz islem' };
    }
    const db = this.dataStore.readData();
    const company = db.companies.find(c => c.id === vehicleData.companyId) || db.companies[0];
    
    const newVehicle = {
      id: `VEH-${Date.now().toString().slice(-4)}`,
      companyId: company?.id || 'CMP-0001',
      plate: vehicleData.plate?.trim().toUpperCase() || 'KK-0001',
      busType: vehicleData.busType?.trim() || 'Standard',
      seatsTotal: vehicleData.seatsTotal || 40,
      seatLayout: vehicleData.seatLayout || '2+2',
      seatRows: Math.ceil((vehicleData.seatsTotal || 40) / (vehicleData.seatLayout === '2+1' ? 3 : vehicleData.seatLayout === '1+1' ? 2 : 4)),
      createdAt: new Date().toISOString(),
    };
    db.vehicles.push(newVehicle);
    this.dataStore.saveData(db);
    this.logAudit(adminToken, 'CREATE_VEHICLE', `Created vehicle ${newVehicle.plate}`);
    return { ok: true, vehicle: newVehicle };
  }

  deleteVehicle(adminToken: string, vehicleId: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.manageTrips)) {
      return { ok: false, message: 'Yetkisiz islem' };
    }
    const db = this.dataStore.readData();
    const index = db.vehicles.findIndex(v => v.id === vehicleId);
    if (index === -1) {
      return { ok: false, message: 'Arac bulunamadi' };
    }
    const deleted = db.vehicles.splice(index, 1)[0];
    this.dataStore.saveData(db);
    this.logAudit(adminToken, 'DELETE_VEHICLE', `Deleted vehicle ${deleted.plate}`);
    return { ok: true };
  }

  // Reports & Analytics
  getRevenueReport(adminToken: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly', startDate?: string, endDate?: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    const db = this.dataStore.readData();
    const bookings = db.bookings.filter(b => b.status !== 'Canceled');
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const filtered = bookings.filter(b => {
      const date = new Date(b.createdAt);
      return date >= start && date <= end;
    });
    
    const revenue = filtered.reduce((sum, b) => sum + b.totalPrice, 0);
    const byPeriod = this.groupByPeriod(filtered, period);
    
    return { 
      ok: true, 
      summary: { totalRevenue: revenue, totalBookings: filtered.length, averageTicket: filtered.length ? revenue / filtered.length : 0 },
      byPeriod 
    };
  }

  getRouteReport(adminToken: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    const db = this.dataStore.readData();
    const routeStats = new Map<string, { bookings: number; revenue: number; passengers: number }>();
    
    db.bookings.filter(b => b.status !== 'Canceled').forEach(b => {
      const stats = routeStats.get(b.route) || { bookings: 0, revenue: 0, passengers: 0 };
      stats.bookings++;
      stats.revenue += b.totalPrice;
      stats.passengers += b.passengers || 1;
      routeStats.set(b.route, stats);
    });
    
    return { ok: true, routes: Array.from(routeStats.entries()).map(([route, stats]) => ({ route, ...stats })) };
  }

  getCompanyReport(adminToken: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    const db = this.dataStore.readData();
    const companyStats = new Map<string, { trips: number; bookings: number; revenue: number }>();
    
    db.companies.forEach(c => {
      companyStats.set(c.companyName, { trips: 0, bookings: 0, revenue: 0 });
    });
    
    db.trips.forEach(t => {
      const company = db.companies.find(c => c.id === t.companyId)?.companyName || t.company;
      const stats = companyStats.get(company) || { trips: 0, bookings: 0, revenue: 0 };
      stats.trips++;
      companyStats.set(company, stats);
    });
    
    db.bookings.filter(b => b.status !== 'Canceled').forEach(b => {
      const stats = companyStats.get(b.company) || { trips: 0, bookings: 0, revenue: 0 };
      stats.bookings++;
      stats.revenue += b.totalPrice;
      companyStats.set(b.company, stats);
    });
    
    return { ok: true, companies: Array.from(companyStats.entries()).map(([name, stats]) => ({ name, ...stats })) };
  }

  exportReport(adminToken: string, type: 'bookings' | 'revenue' | 'users', format: 'csv' | 'json', startDate?: string, endDate?: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    const db = this.dataStore.readData();
    let data: any[] = [];
    
    if (type === 'bookings') {
      data = db.bookings;
    } else if (type === 'revenue') {
      data = db.bookings.filter(b => b.status !== 'Canceled').map(b => ({
        bookingCode: b.bookingCode,
        route: b.route,
        totalPrice: b.totalPrice,
        status: b.status,
        createdAt: b.createdAt,
      }));
    } else if (type === 'users') {
      data = db.bookings.map(b => ({
        passengerName: b.passengerName,
        passengerEmail: b.passengerEmail,
        bookings: db.bookings.filter(bb => bb.passengerEmail === b.passengerEmail).length,
      }));
      // Remove duplicates
      data = data.filter((v, i, a) => a.findIndex(t => t.passengerEmail === v.passengerEmail) === i);
    }
    
    if (startDate) {
      data = data.filter(d => new Date(d.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      data = data.filter(d => new Date(d.createdAt) <= new Date(endDate));
    }
    
    if (format === 'csv') {
      const headers = data.length > 0 ? Object.keys(data[0]).join(',') : '';
      const rows = data.map(row => Object.values(row).join(','));
      return { ok: true, format: 'csv', data: [headers, ...rows].join('\n') };
    }
    
    return { ok: true, format: 'json', data };
  }

  // Audit Logs
  private auditLogs: Array<{ timestamp: string; action: string; details: string; adminToken: string }> = [];

  private logAudit(adminToken: string, action: string, details: string) {
    this.auditLogs.unshift({
      timestamp: new Date().toISOString(),
      action,
      details,
      adminToken: adminToken.slice(0, 8) + '...',
    });
    // Keep only last 1000 logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(0, 1000);
    }
  }

  getAuditLogs(adminToken: string, limit: number = 50, action?: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    let logs = this.auditLogs;
    if (action) {
      logs = logs.filter(l => l.action === action);
    }
    return { ok: true, logs: logs.slice(0, limit) };
  }

  // Realtime Stats
  getRealtimeStats(adminToken: string) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    const db = this.dataStore.readData();
    const today = new Date().toISOString().slice(0, 10);
    const todayBookings = db.bookings.filter(b => b.createdAt.startsWith(today));
    
    return {
      ok: true,
      stats: {
        activeTripsToday: db.trips.filter(t => t.departureDate === today).length,
        bookingsToday: todayBookings.length,
        revenueToday: todayBookings.filter(b => b.status !== 'Canceled').reduce((s, b) => s + b.totalPrice, 0),
        pendingCompanies: db.companies.filter(c => c.status === 'pending').length,
        totalActiveUsers: new Set(db.bookings.map(b => b.passengerEmail)).size,
      },
    };
  }

  async getPerformanceStats(adminToken: string, days: number = 30) {
    if (!this.dataStore.canAdminAccess(adminToken, accessRules.companyRequests)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    const db = this.dataStore.readData();
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentBookings = db.bookings.filter(b => new Date(b.createdAt) >= cutoff);
    
    const confirmed = recentBookings.filter(b => b.status === 'Confirmed');
    const canceled = recentBookings.filter(b => b.status === 'Canceled');
    const completed = recentBookings.filter(b => b.status === 'Completed');
    
    return {
      ok: true,
      period: `${days} days`,
      conversion: {
        total: recentBookings.length,
        confirmed: confirmed.length,
        completed: completed.length,
        canceled: canceled.length,
        conversionRate: recentBookings.length ? ((confirmed.length + completed.length) / recentBookings.length * 100).toFixed(2) + '%' : '0%',
      },
      revenue: {
        total: confirmed.reduce((s, b) => s + b.totalPrice, 0) + completed.reduce((s, b) => s + b.totalPrice, 0),
        averagePerBooking: (confirmed.length + completed.length) ? ((confirmed.reduce((s, b) => s + b.totalPrice, 0) + completed.reduce((s, b) => s + b.totalPrice, 0)) / (confirmed.length + completed.length)) : 0,
      },
      topRoutes: (await this.getRouteReport(adminToken)).routes?.slice(0, 5) || [],
    };
  }

  private groupByPeriod(bookings: any[], period: 'daily' | 'weekly' | 'monthly' | 'yearly') {
    const groups = new Map<string, { revenue: number; bookings: number }>();
    
    bookings.forEach(b => {
      const date = new Date(b.createdAt);
      let key: string;
      
      if (period === 'daily') {
        key = date.toISOString().slice(0, 10);
      } else if (period === 'weekly') {
        const week = Math.floor(date.getDate() / 7) + 1;
        key = `${date.getFullYear()}-W${week}`;
      } else if (period === 'monthly') {
        key = date.toISOString().slice(0, 7);
      } else {
        key = date.getFullYear().toString();
      }
      
      const existing = groups.get(key) || { revenue: 0, bookings: 0 };
      existing.revenue += b.totalPrice;
      existing.bookings++;
      groups.set(key, existing);
    });
    
    return Array.from(groups.entries()).map(([period, data]) => ({ period, ...data }));
  }
}
