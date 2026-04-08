import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

type BookingStatus = 'Confirmed' | 'Completed' | 'Canceled';
type CompanyStatus = 'pending' | 'approved' | 'rejected';

export type RouteSummary = {
  from: string;
  to: string;
  basePrice: number;
  durationMinutes: number;
};

export type Trip = {
  id: string;
  companyId: string;
  company: string;
  from: string;
  to: string;
  departureTime: string;
  durationMinutes: number;
  price: number;
  busType: string;
  rating: number;
  seatsTotal: number;
};

export type BookingInput = {
  tripId: string;
  passengerName: string;
  passengerEmail: string;
  seatNumber: string;
  passengers?: number;
  travelDate?: string;
};

export type BookingRecord = {
  bookingCode: string;
  tripId: string;
  route: string;
  company: string;
  seatNumber: string;
  passengerName: string;
  passengerEmail: string;
  totalPrice: number;
  status: BookingStatus;
  passengers: number;
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  createdAt: string;
};

export type CompanyAccount = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  password: string;
  status: CompanyStatus;
  createdAt: string;
  approvedAt?: string;
};

export type CompanyVehicle = {
  id: string;
  companyId: string;
  plate: string;
  busType: string;
  seatsTotal: number;
  createdAt: string;
};

type PersistedData = {
  routes: RouteSummary[];
  trips: Trip[];
  bookings: BookingRecord[];
  companies: CompanyAccount[];
  vehicles: CompanyVehicle[];
};

@Injectable()
export class AppService {
  private readonly dataPath = this.resolveDataPath();
  private readonly adminUser = 'admin';
  private readonly adminPass = 'Admin123!';
  private readonly adminTokens = new Set<string>();
  private readonly companyTokens = new Map<string, string>();

  constructor() {
    this.ensureDataStore();
    this.ensureDataShape();
  }

  private resolveDataPath(): string {
    const cwd = process.cwd();
    const localDataDir = join(cwd, 'data');
    if (existsSync(localDataDir)) {
      return join(localDataDir, 'db.json');
    }
    return join(cwd, 'backend', 'data', 'db.json');
  }

  private ensureDataStore(): void {
    const dir = dirname(this.dataPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    if (!existsSync(this.dataPath)) {
      const seededCompanyId = 'CMP-0001';
      const seed: PersistedData = {
        routes: [
          {
            from: 'Mumbai',
            to: 'Pune',
            basePrice: 450,
            durationMinutes: 210,
          },
          {
            from: 'Delhi',
            to: 'Jaipur',
            basePrice: 650,
            durationMinutes: 345,
          },
          {
            from: 'Bangalore',
            to: 'Chennai',
            basePrice: 550,
            durationMinutes: 375,
          },
          {
            from: 'Hyderabad',
            to: 'Vijayawada',
            basePrice: 350,
            durationMinutes: 260,
          },
        ],
        trips: [
          {
            id: 'TRP-5001',
            companyId: seededCompanyId,
            company: 'RedBus Travels',
            from: 'Mumbai',
            to: 'Pune',
            departureTime: '10:30 PM',
            durationMinutes: 375,
            price: 850,
            busType: 'AC Sleeper',
            rating: 4.5,
            seatsTotal: 40,
          },
          {
            id: 'TRP-5002',
            companyId: seededCompanyId,
            company: 'SRS Travels',
            from: 'Mumbai',
            to: 'Pune',
            departureTime: '11:15 PM',
            durationMinutes: 375,
            price: 720,
            busType: 'AC Semi-Sleeper',
            rating: 4.2,
            seatsTotal: 36,
          },
          {
            id: 'TRP-5003',
            companyId: seededCompanyId,
            company: 'Volvo Travels',
            from: 'Mumbai',
            to: 'Pune',
            departureTime: '10:45 PM',
            durationMinutes: 375,
            price: 950,
            busType: 'Volvo AC Multi-Axle',
            rating: 4.7,
            seatsTotal: 36,
          },
          {
            id: 'TRP-5004',
            companyId: seededCompanyId,
            company: 'Parveen Travels',
            from: 'Mumbai',
            to: 'Pune',
            departureTime: '6:00 AM',
            durationMinutes: 435,
            price: 450,
            busType: 'Non-AC Seater',
            rating: 3.9,
            seatsTotal: 48,
          },
        ],
        bookings: [],
        companies: [
          {
            id: seededCompanyId,
            companyName: 'Near East Ulasim Partner',
            contactName: 'Sistem Firma Yoneticisi',
            email: 'company@neareast.local',
            password: 'Company123!',
            status: 'approved',
            createdAt: new Date().toISOString(),
            approvedAt: new Date().toISOString(),
          },
        ],
        vehicles: [],
      };
      this.saveData(seed);
    }
  }

  private ensureDataShape(): void {
    const raw = JSON.parse(readFileSync(this.dataPath, 'utf-8')) as Partial<PersistedData>;
    const db: PersistedData = {
      routes: Array.isArray(raw.routes) ? raw.routes : [],
      trips: Array.isArray(raw.trips) ? (raw.trips as Trip[]) : [],
      bookings: Array.isArray(raw.bookings) ? raw.bookings : [],
      companies: Array.isArray(raw.companies) ? raw.companies : [],
      vehicles: Array.isArray(raw.vehicles) ? raw.vehicles : [],
    };

    if (!db.companies.length) {
      db.companies.push({
        id: 'CMP-0001',
        companyName: 'Near East Ulasim Partner',
        contactName: 'Sistem Firma Yoneticisi',
        email: 'company@neareast.local',
        password: 'Company123!',
        status: 'approved',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
      });
    }

    const approvedCompany = db.companies.find((item) => item.status === 'approved') ?? db.companies[0];
    db.trips = db.trips.map((trip) => ({
      ...trip,
      companyId: trip.companyId ?? approvedCompany.id,
    }));

    this.saveData(db);
  }

  private readData(): PersistedData {
    return JSON.parse(readFileSync(this.dataPath, 'utf-8')) as PersistedData;
  }

  private saveData(data: PersistedData): void {
    writeFileSync(this.dataPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private generateToken(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private getCompanyIdByToken(token: string): string | null {
    return this.companyTokens.get(token) ?? null;
  }

  private isAdminTokenValid(token: string): boolean {
    return this.adminTokens.has(token);
  }

  private getBookedSeats(
    bookings: BookingRecord[],
    tripId: string,
  ): Set<string> {
    return new Set(
      bookings
        .filter(
          (booking) =>
            booking.tripId === tripId && booking.status !== 'Canceled',
        )
        .map((booking) => booking.seatNumber),
    );
  }

  private toSeats(trip: Trip, bookedSeats: Set<string>) {
    const rows = Math.ceil(trip.seatsTotal / 4);
    const seats: { seatNumber: string; status: 'available' | 'booked' }[] = [];
    for (let row = 1; row <= rows; row += 1) {
      for (const col of ['A', 'B', 'C', 'D']) {
        if (seats.length >= trip.seatsTotal) {
          break;
        }
        const seatNumber = `${col}${row}`;
        seats.push({
          seatNumber,
          status: bookedSeats.has(seatNumber) ? 'booked' : 'available',
        });
      }
    }
    return seats;
  }

  getHealth() {
    return {
      ok: true,
      service: 'otobus-rezervasyon-api',
      timestamp: new Date().toISOString(),
    };
  }

  getRoutes() {
    return this.readData().routes;
  }

  adminLogin(input: { username: string; password: string }) {
    const username = input.username?.trim();
    const password = input.password?.trim();
    if (username !== this.adminUser || password !== this.adminPass) {
      return { ok: false, message: 'Yonetici giris bilgileri hatali' };
    }
    const token = this.generateToken('ADM');
    this.adminTokens.add(token);
    return { ok: true, token };
  }

  companyRegister(input: {
    companyName: string;
    contactName: string;
    email: string;
    password: string;
  }) {
    const db = this.readData();
    const email = input.email.trim().toLowerCase();

    if (!input.companyName.trim() || !input.contactName.trim() || !email || !input.password.trim()) {
      return { ok: false, message: 'Tum alanlar zorunludur' };
    }

    const exists = db.companies.find((item) => item.email === email);
    if (exists) {
      return { ok: false, message: 'Bu e-posta ile kayitli firma var' };
    }

    const newCompany: CompanyAccount = {
      id: `CMP-${Date.now().toString().slice(-6)}`,
      companyName: input.companyName.trim(),
      contactName: input.contactName.trim(),
      email,
      password: input.password,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.companies.unshift(newCompany);
    this.saveData(db);
    return { ok: true, message: 'Basvuru alindi. Admin onayi bekleniyor.' };
  }

  companyLogin(input: { email: string; password: string }) {
    const db = this.readData();
    const email = input.email.trim().toLowerCase();
    const company = db.companies.find((item) => item.email === email);

    if (!company || company.password !== input.password) {
      return { ok: false, message: 'Firma giris bilgileri hatali' };
    }
    if (company.status !== 'approved') {
      return { ok: false, message: 'Firma hesabi henuz onaylanmadi' };
    }

    const token = this.generateToken('CMP');
    this.companyTokens.set(token, company.id);
    return {
      ok: true,
      token,
      company: {
        id: company.id,
        companyName: company.companyName,
        contactName: company.contactName,
        email: company.email,
      },
    };
  }

  getCompanyRequests(adminToken: string) {
    if (!this.isAdminTokenValid(adminToken)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }
    const db = this.readData();
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
    if (!this.isAdminTokenValid(adminToken)) {
      return { ok: false, message: 'Yonetici oturumu gecersiz' };
    }

    const db = this.readData();
    const company = db.companies.find((item) => item.id === companyId);
    if (!company) {
      return { ok: false, message: 'Firma bulunamadi' };
    }

    company.status = 'approved';
    company.approvedAt = new Date().toISOString();
    this.saveData(db);
    return { ok: true };
  }

  getCompanyOverview(companyToken: string) {
    const companyId = this.getCompanyIdByToken(companyToken);
    if (!companyId) {
      return { ok: false, message: 'Firma oturumu gecersiz' };
    }

    const db = this.readData();
    const company = db.companies.find((item) => item.id === companyId);
    if (!company) {
      return { ok: false, message: 'Firma bulunamadi' };
    }

    const companyTrips = db.trips.filter((trip) => trip.companyId === companyId);
    const companyTripIds = new Set(companyTrips.map((trip) => trip.id));
    const companyBookings = db.bookings.filter((booking) => companyTripIds.has(booking.tripId));
    const revenue = companyBookings
      .filter((item) => item.status !== 'Canceled')
      .reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      ok: true,
      company: {
        id: company.id,
        companyName: company.companyName,
        contactName: company.contactName,
        email: company.email,
      },
      metrics: {
        vehicles: db.vehicles.filter((item) => item.companyId === companyId).length,
        trips: companyTrips.length,
        bookings: companyBookings.length,
        revenue,
      },
    };
  }

  getCompanyVehicles(companyToken: string) {
    const companyId = this.getCompanyIdByToken(companyToken);
    if (!companyId) {
      return { ok: false, message: 'Firma oturumu gecersiz' };
    }
    const db = this.readData();
    return {
      ok: true,
      vehicles: db.vehicles.filter((item) => item.companyId === companyId),
    };
  }

  addCompanyVehicle(
    companyToken: string,
    input: { plate: string; busType: string; seatsTotal: number },
  ) {
    const companyId = this.getCompanyIdByToken(companyToken);
    if (!companyId) {
      return { ok: false, message: 'Firma oturumu gecersiz' };
    }

    const plate = input.plate.trim().toUpperCase();
    const busType = input.busType.trim();
    const seatsTotal = Number(input.seatsTotal);

    if (!plate || !busType || !Number.isFinite(seatsTotal) || seatsTotal < 10) {
      return { ok: false, message: 'Arac bilgileri gecersiz' };
    }

    const db = this.readData();
    const vehicle: CompanyVehicle = {
      id: `BUS-${Date.now().toString().slice(-6)}`,
      companyId,
      plate,
      busType,
      seatsTotal,
      createdAt: new Date().toISOString(),
    };
    db.vehicles.unshift(vehicle);
    this.saveData(db);
    return { ok: true, vehicle };
  }

  getCompanyTrips(companyToken: string) {
    const companyId = this.getCompanyIdByToken(companyToken);
    if (!companyId) {
      return { ok: false, message: 'Firma oturumu gecersiz' };
    }
    const db = this.readData();
    return {
      ok: true,
      trips: db.trips.filter((item) => item.companyId === companyId),
    };
  }

  addCompanyTrip(
    companyToken: string,
    input: {
      from: string;
      to: string;
      departureTime: string;
      durationMinutes: number;
      price: number;
      busType: string;
      seatsTotal: number;
    },
  ) {
    const companyId = this.getCompanyIdByToken(companyToken);
    if (!companyId) {
      return { ok: false, message: 'Firma oturumu gecersiz' };
    }

    const db = this.readData();
    const company = db.companies.find((item) => item.id === companyId);
    if (!company) {
      return { ok: false, message: 'Firma bulunamadi' };
    }

    const trip: Trip = {
      id: `TRP-${Date.now().toString().slice(-6)}`,
      companyId,
      company: company.companyName,
      from: input.from.trim(),
      to: input.to.trim(),
      departureTime: input.departureTime.trim(),
      durationMinutes: Number(input.durationMinutes),
      price: Number(input.price),
      busType: input.busType.trim(),
      rating: 4.0,
      seatsTotal: Number(input.seatsTotal),
    };

    if (
      !trip.from ||
      !trip.to ||
      !trip.departureTime ||
      !trip.busType ||
      !Number.isFinite(trip.durationMinutes) ||
      !Number.isFinite(trip.price) ||
      !Number.isFinite(trip.seatsTotal)
    ) {
      return { ok: false, message: 'Sefer bilgileri gecersiz' };
    }

    db.trips.unshift(trip);
    this.saveData(db);
    return { ok: true, trip };
  }

  searchTrips(from?: string, to?: string) {
    const db = this.readData();
    return db.trips
      .filter((trip) => {
        const matchFrom = from
          ? trip.from.toLowerCase() === from.toLowerCase()
          : true;
        const matchTo = to ? trip.to.toLowerCase() === to.toLowerCase() : true;
        return matchFrom && matchTo;
      })
      .map((trip) => {
        const booked = this.getBookedSeats(db.bookings, trip.id).size;
        return {
          ...trip,
          seatsAvailable: Math.max(0, trip.seatsTotal - booked),
        };
      });
  }

  getSeats(tripId: string) {
    const db = this.readData();
    const trip = db.trips.find((item) => item.id === tripId);
    if (!trip) {
      return { found: false, message: 'Sefer bulunamadı' };
    }

    const bookedSeats = this.getBookedSeats(db.bookings, tripId);
    return {
      found: true,
      tripId,
      seats: this.toSeats(trip, bookedSeats),
    };
  }

  getBookings(passengerEmail?: string): BookingRecord[] {
    const db = this.readData();
    const normalizedEmail = passengerEmail?.trim().toLowerCase();
    return db.bookings
      .filter((booking) =>
        normalizedEmail
          ? booking.passengerEmail.toLowerCase() === normalizedEmail
          : true,
      )
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getBookingByCode(bookingCode: string): BookingRecord | null {
    const db = this.readData();
    return (
      db.bookings.find((booking) => booking.bookingCode === bookingCode) ?? null
    );
  }

  cancelBooking(bookingCode: string) {
    const db = this.readData();
    const booking = db.bookings.find(
      (item) => item.bookingCode === bookingCode,
    );
    if (!booking) {
      return { ok: false, message: 'Rezervasyon bulunamadı' };
    }
    if (booking.status === 'Canceled') {
      return { ok: false, message: 'Rezervasyon zaten iptal edilmiş' };
    }
    booking.status = 'Canceled';
    this.saveData(db);
    return { ok: true, booking };
  }

  getBookingTicket(bookingCode: string) {
    const booking = this.getBookingByCode(bookingCode);
    if (!booking) {
      return { ok: false, message: 'Rezervasyon bulunamadı' };
    }
    return {
      ok: true,
      fileName: `${booking.bookingCode}.txt`,
      content: [
        `Bilet: ${booking.bookingCode}`,
        `Yolcu: ${booking.passengerName}`,
        `Rota: ${booking.route}`,
        `Firma: ${booking.company}`,
        `Koltuk: ${booking.seatNumber}`,
        `Tarih: ${booking.travelDate}`,
        `Saat: ${booking.departureTime} - ${booking.arrivalTime}`,
        `Tutar: ₺ ${booking.totalPrice}`,
        `Durum: ${booking.status}`,
      ].join('\n'),
    };
  }

  createBooking(input: BookingInput) {
    const db = this.readData();
    const trip = db.trips.find((item) => item.id === input.tripId);
    if (!trip) {
      return { ok: false, message: 'Sefer bulunamadı' };
    }

    const bookedSeats = this.getBookedSeats(db.bookings, input.tripId);
    const seats = this.toSeats(trip, bookedSeats);
    const seatExists = seats.some(
      (seat) => seat.seatNumber === input.seatNumber,
    );
    if (!seatExists) {
      return { ok: false, message: 'Geçersiz koltuk numarası' };
    }
    if (bookedSeats.has(input.seatNumber)) {
      return { ok: false, message: 'Koltuk daha önce rezerve edilmiş' };
    }

    const bookingCode = `RB-${Date.now().toString().slice(-6)}`;
    const passengers = Math.max(1, Number(input.passengers ?? 1));
    const newBooking: BookingRecord = {
      bookingCode,
      tripId: trip.id,
      route: `${trip.from} - ${trip.to}`,
      company: trip.company,
      seatNumber: input.seatNumber,
      passengerName: input.passengerName.trim(),
      passengerEmail: input.passengerEmail.trim().toLowerCase(),
      totalPrice: trip.price * passengers,
      status: 'Confirmed',
      passengers,
      travelDate: input.travelDate ?? new Date().toISOString().slice(0, 10),
      departureTime: trip.departureTime,
      arrivalTime: 'Tahmini',
      createdAt: new Date().toISOString(),
    };

    db.bookings.unshift(newBooking);
    this.saveData(db);

    return {
      ok: true,
      bookingCode: newBooking.bookingCode,
      tripId: newBooking.tripId,
      seatNumber: newBooking.seatNumber,
      passengerName: newBooking.passengerName,
      passengerEmail: newBooking.passengerEmail,
      totalPrice: newBooking.totalPrice,
      status: newBooking.status,
    };
  }

  getAdminOverview() {
    const db = this.readData();
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
