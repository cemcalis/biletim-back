import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../common/data/data-store.service';
import { AdminRole, Trip } from '../common/types';

const accessRules: Record<string, AdminRole[]> = {
  companyRequests: ['super-admin'],
  approveCompany: ['super-admin'],
  manageTrips: ['super-admin', 'company-admin'],
};

@Injectable()
export class AdminService {
  constructor(private readonly dataStore: DataStoreService) {}

  login(input: { username: string; password: string; role?: AdminRole }) {
    const username = input.username?.trim();
    const password = input.password?.trim();
    const role = input.role ?? 'super-admin';
    const adminCredentials = this.dataStore.getAdminCredentials();

    if (
      username !== adminCredentials.username ||
      password !== adminCredentials.password
    ) {
      return { ok: false, message: 'Yonetici giris bilgileri hatali' };
    }

    const token = this.dataStore.addAdminSession(role);
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
      company: tripData.company ?? 'Biletim A.Ş. Seferleri',
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
}
