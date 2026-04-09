import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { AdminRole, BookingRecord, PersistedData, SeatInfo, Trip } from '../types';

type AdminSession = {
  role: AdminRole;
  createdAt: string;
};

@Injectable()
export class DataStoreService {
  private readonly dataPath = this.resolveDataPath();

  private readonly adminUser = 'admin';
  private readonly adminPass = 'Admin123!';
  private readonly adminTokens = new Map<string, AdminSession>();
  private readonly companyTokens = new Map<string, string>();

  constructor() {
    this.ensureDataStore();
    this.ensureDataShape();
  }

  getAdminCredentials() {
    return { username: this.adminUser, password: this.adminPass };
  }

  addAdminSession(role: AdminRole): string {
    const token = this.generateToken('ADM');
    this.adminTokens.set(token, {
      role,
      createdAt: new Date().toISOString(),
    });
    return token;
  }

  isAdminTokenValid(token: string): boolean {
    return this.adminTokens.has(token);
  }

  getAdminSession(token: string): AdminSession | null {
    return this.adminTokens.get(token) ?? null;
  }

  getAdminRole(token: string): AdminRole | null {
    return this.getAdminSession(token)?.role ?? null;
  }

  canAdminAccess(token: string, allowedRoles: AdminRole[]): boolean {
    const role = this.getAdminRole(token);
    return role ? allowedRoles.includes(role) : false;
  }

  addCompanySession(companyId: string): string {
    const token = this.generateToken('CMP');
    this.companyTokens.set(token, companyId);
    return token;
  }

  getCompanyIdByToken(token: string): string | null {
    return this.companyTokens.get(token) ?? null;
  }

  readData(): PersistedData {
    return JSON.parse(readFileSync(this.dataPath, 'utf-8')) as PersistedData;
  }

  saveData(data: PersistedData): void {
    writeFileSync(this.dataPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  getBookedSeats(bookings: BookingRecord[], tripId: string): Set<string> {
    return new Set(
      bookings
        .filter(
          (booking) =>
            booking.tripId === tripId && booking.status !== 'Canceled',
        )
        .map((booking) => booking.seatNumber),
    );
  }

  private getLayoutColumns(layout: Trip['seatLayout']): string[] {
    if (layout === '2+1') {
      return ['A', 'B', 'C'];
    }
    if (layout === '1+1') {
      return ['A', 'B'];
    }
    return ['A', 'B', 'C', 'D'];
  }

  toSeats(trip: Trip, bookedSeats: Set<string>): SeatInfo[] {
    const columns = this.getLayoutColumns(trip.seatLayout ?? '2+2');
    const rows = Math.ceil(trip.seatsTotal / columns.length);
    const seats: SeatInfo[] = [];
    for (let row = 1; row <= rows; row += 1) {
      for (const col of columns) {
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

    const today = new Date().toISOString().slice(0, 10);

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
            departureDate: today,
            arrivalDate: today,
            departureTime: '10:30 PM',
            durationMinutes: 375,
            price: 850,
            busType: 'AC Sleeper',
            rating: 4.5,
            seatsTotal: 40,
            seatLayout: '2+2',
          },
          {
            id: 'TRP-5002',
            companyId: seededCompanyId,
            company: 'SRS Travels',
            from: 'Mumbai',
            to: 'Pune',
            departureDate: today,
            arrivalDate: today,
            departureTime: '11:15 PM',
            durationMinutes: 375,
            price: 720,
            busType: 'AC Semi-Sleeper',
            rating: 4.2,
            seatsTotal: 36,
            seatLayout: '2+2',
          },
          {
            id: 'TRP-5003',
            companyId: seededCompanyId,
            company: 'Volvo Travels',
            from: 'Mumbai',
            to: 'Pune',
            departureDate: today,
            arrivalDate: today,
            departureTime: '10:45 PM',
            durationMinutes: 375,
            price: 950,
            busType: 'Volvo AC Multi-Axle',
            rating: 4.7,
            seatsTotal: 36,
            seatLayout: '2+2',
          },
          {
            id: 'TRP-5004',
            companyId: seededCompanyId,
            company: 'Parveen Travels',
            from: 'Mumbai',
            to: 'Pune',
            departureDate: today,
            arrivalDate: today,
            departureTime: '6:00 AM',
            durationMinutes: 435,
            price: 450,
            busType: 'Non-AC Seater',
            rating: 3.9,
            seatsTotal: 48,
            seatLayout: '2+2',
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
    const today = new Date().toISOString().slice(0, 10);
    const raw = JSON.parse(
      readFileSync(this.dataPath, 'utf-8'),
    ) as Partial<PersistedData>;
    const db: PersistedData = {
      routes: Array.isArray(raw.routes) ? raw.routes : [],
      trips: Array.isArray(raw.trips) ? raw.trips : [],
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

    const approvedCompany =
      db.companies.find((item) => item.status === 'approved') ??
      db.companies[0];

    db.vehicles = db.vehicles.map((vehicle) => {
      const seatLayout = (vehicle.seatLayout ?? '2+2') as
        | '2+2'
        | '2+1'
        | '1+1';
      const columns = this.getLayoutColumns(seatLayout);
      const seatsTotal = Number(vehicle.seatsTotal ?? 40);
      const seatRows =
        Number(vehicle.seatRows) > 0
          ? Number(vehicle.seatRows)
          : Math.ceil(seatsTotal / columns.length);

      return {
        ...vehicle,
        seatLayout,
        seatRows,
        seatsTotal,
      };
    });

    db.trips = db.trips.map((trip) => ({
      ...trip,
      companyId: trip.companyId ?? approvedCompany.id,
      departureDate: trip.departureDate ?? today,
      arrivalDate: trip.arrivalDate ?? trip.departureDate ?? today,
      seatLayout: trip.seatLayout ?? '2+2',
    }));

    this.saveData(db);
  }

  private generateToken(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
