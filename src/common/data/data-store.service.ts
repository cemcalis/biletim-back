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
  private adminPass = 'Admin123!';
  private readonly adminTokens = new Map<string, AdminSession>();
  private readonly companyTokens = new Map<string, string>();

  constructor() {
    this.ensureDataStore();
    this.ensureDataShape();
  }

  getAdminCredentials() {
    return { username: this.adminUser, password: this.adminPass };
  }

  updateAdminPassword(newPassword: string) {
    this.adminPass = newPassword;
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
          // Kıbrıs Güzergahları - Ana Hatlar
          {
            from: 'Lefkoşa',
            to: 'Girne',
            basePrice: 120,
            durationMinutes: 45,
          },
          {
            from: 'Lefkoşa',
            to: 'Mağusa',
            basePrice: 150,
            durationMinutes: 65,
          },
          {
            from: 'Lefkoşa',
            to: 'Güzelyurt',
            basePrice: 100,
            durationMinutes: 40,
          },
          {
            from: 'Lefkoşa',
            to: 'İskele',
            basePrice: 140,
            durationMinutes: 60,
          },
          {
            from: 'Lefkoşa',
            to: 'Lefke',
            basePrice: 110,
            durationMinutes: 50,
          },
          {
            from: 'Girne',
            to: 'Mağusa',
            basePrice: 180,
            durationMinutes: 85,
          },
          {
            from: 'Girne',
            to: 'Güzelyurt',
            basePrice: 90,
            durationMinutes: 35,
          },
          {
            from: 'Girne',
            to: 'Lefke',
            basePrice: 130,
            durationMinutes: 55,
          },
          {
            from: 'Mağusa',
            to: 'İskele',
            basePrice: 80,
            durationMinutes: 25,
          },
          {
            from: 'Mağusa',
            to: 'Güzelyurt',
            basePrice: 200,
            durationMinutes: 95,
          },
          // Ters yönler
          {
            from: 'Girne',
            to: 'Lefkoşa',
            basePrice: 120,
            durationMinutes: 45,
          },
          {
            from: 'Mağusa',
            to: 'Lefkoşa',
            basePrice: 150,
            durationMinutes: 65,
          },
          {
            from: 'Güzelyurt',
            to: 'Lefkoşa',
            basePrice: 100,
            durationMinutes: 40,
          },
          {
            from: 'İskele',
            to: 'Lefkoşa',
            basePrice: 140,
            durationMinutes: 60,
          },
          {
            from: 'Lefke',
            to: 'Lefkoşa',
            basePrice: 110,
            durationMinutes: 50,
          },
        ],
        trips: [
          // Lefkoşa - Girne Seferleri
          {
            id: 'TRP-5001',
            companyId: seededCompanyId,
            company: 'Near East Way Express',
            from: 'Lefkoşa',
            to: 'Girne',
            departureDate: today,
            arrivalDate: today,
            departureTime: '08:00',
            durationMinutes: 45,
            price: 120,
            busType: 'Mercedes-Benz Travego',
            rating: 4.8,
            seatsTotal: 44,
            seatLayout: '2+2',
          },
          {
            id: 'TRP-5002',
            companyId: seededCompanyId,
            company: 'Kıbrıs Premium Tours',
            from: 'Lefkoşa',
            to: 'Girne',
            departureDate: today,
            arrivalDate: today,
            departureTime: '12:30',
            durationMinutes: 45,
            price: 140,
            busType: 'Volvo 9700 VIP',
            rating: 4.9,
            seatsTotal: 36,
            seatLayout: '2+1',
          },
          {
            id: 'TRP-5003',
            companyId: seededCompanyId,
            company: 'Girne Shuttle',
            from: 'Lefkoşa',
            to: 'Girne',
            departureDate: today,
            arrivalDate: today,
            departureTime: '18:00',
            durationMinutes: 50,
            price: 100,
            busType: 'Mercedes Sprinter',
            rating: 4.5,
            seatsTotal: 19,
            seatLayout: '2+1',
          },
          // Lefkoşa - Mağusa Seferleri
          {
            id: 'TRP-5004',
            companyId: seededCompanyId,
            company: 'Near East Way Express',
            from: 'Lefkoşa',
            to: 'Mağusa',
            departureDate: today,
            arrivalDate: today,
            departureTime: '09:00',
            durationMinutes: 65,
            price: 150,
            busType: 'Mercedes-Benz Travego',
            rating: 4.7,
            seatsTotal: 44,
            seatLayout: '2+2',
          },
          {
            id: 'TRP-5005',
            companyId: seededCompanyId,
            company: 'Mağusa Line',
            from: 'Lefkoşa',
            to: 'Mağusa',
            departureDate: today,
            arrivalDate: today,
            departureTime: '16:00',
            durationMinutes: 70,
            price: 130,
            busType: 'Setra ComfortClass',
            rating: 4.4,
            seatsTotal: 40,
            seatLayout: '2+2',
          },
          // Lefkoşa - Güzelyurt Seferleri
          {
            id: 'TRP-5006',
            companyId: seededCompanyId,
            company: 'Güzelyurt Turizm',
            from: 'Lefkoşa',
            to: 'Güzelyurt',
            departureDate: today,
            arrivalDate: today,
            departureTime: '10:00',
            durationMinutes: 40,
            price: 100,
            busType: 'Mercedes-Benz Intouro',
            rating: 4.6,
            seatsTotal: 42,
            seatLayout: '2+2',
          },
          // Dönüş Seferleri
          {
            id: 'TRP-5007',
            companyId: seededCompanyId,
            company: 'Near East Way Express',
            from: 'Girne',
            to: 'Lefkoşa',
            departureDate: today,
            arrivalDate: today,
            departureTime: '14:00',
            durationMinutes: 45,
            price: 120,
            busType: 'Mercedes-Benz Travego',
            rating: 4.8,
            seatsTotal: 44,
            seatLayout: '2+2',
          },
          {
            id: 'TRP-5008',
            companyId: seededCompanyId,
            company: 'Mağusa Line',
            from: 'Mağusa',
            to: 'Lefkoşa',
            departureDate: today,
            arrivalDate: today,
            departureTime: '19:30',
            durationMinutes: 65,
            price: 150,
            busType: 'Setra ComfortClass',
            rating: 4.5,
            seatsTotal: 40,
            seatLayout: '2+2',
          },
        ],
        bookings: [],
        companies: [
          {
            id: seededCompanyId,
            companyName: 'Near East Way Partner',
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
        companyName: 'Near East Way Partner',
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
