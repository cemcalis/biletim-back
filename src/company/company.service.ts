import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../common/data/data-store.service';
import { CompanyAccount, CompanyVehicle, Trip } from '../common/types';

@Injectable()
export class CompanyService {
  constructor(private readonly dataStore: DataStoreService) {}

  private getColumnsByLayout(layout: '2+2' | '2+1' | '1+1'): number {
    if (layout === '2+1') {
      return 3;
    }
    if (layout === '1+1') {
      return 2;
    }
    return 4;
  }

  register(input: {
    companyName: string;
    contactName: string;
    email: string;
    password: string;
  }) {
    const db = this.dataStore.readData();
    const email = input.email.trim().toLowerCase();

    if (
      !input.companyName.trim() ||
      !input.contactName.trim() ||
      !email ||
      !input.password.trim()
    ) {
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
    this.dataStore.saveData(db);
    return { ok: true, message: 'Basvuru alindi. Admin onayi bekleniyor.' };
  }

  login(input: { email: string; password: string }) {
    const db = this.dataStore.readData();
    const email = input.email.trim().toLowerCase();
    const company = db.companies.find((item) => item.email === email);

    if (!company || company.password !== input.password) {
      return { ok: false, message: 'Firma giris bilgileri hatali' };
    }
    if (company.status !== 'approved') {
      return { ok: false, message: 'Firma hesabi henuz onaylanmadi' };
    }

    const token = this.dataStore.addCompanySession(company.id);
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

  getOverview(companyToken: string) {
    const companyId = this.dataStore.getCompanyIdByToken(companyToken);
    if (!companyId) {
      return { ok: false, message: 'Firma oturumu gecersiz' };
    }

    const db = this.dataStore.readData();
    const company = db.companies.find((item) => item.id === companyId);
    if (!company) {
      return { ok: false, message: 'Firma bulunamadi' };
    }

    const companyTrips = db.trips.filter(
      (trip) => trip.companyId === companyId,
    );
    const companyTripIds = new Set(companyTrips.map((trip) => trip.id));
    const companyBookings = db.bookings.filter((booking) =>
      companyTripIds.has(booking.tripId),
    );
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
        vehicles: db.vehicles.filter((item) => item.companyId === companyId)
          .length,
        trips: companyTrips.length,
        bookings: companyBookings.length,
        revenue,
      },
    };
  }

  getVehicles(companyToken: string) {
    const companyId = this.dataStore.getCompanyIdByToken(companyToken);
    if (!companyId) {
      return { ok: false, message: 'Firma oturumu gecersiz' };
    }

    const db = this.dataStore.readData();
    return {
      ok: true,
      vehicles: db.vehicles.filter((item) => item.companyId === companyId),
    };
  }

  addVehicle(
    companyToken: string,
    input: {
      plate: string;
      busType: string;
      seatLayout: '2+2' | '2+1' | '1+1';
      seatRows: number;
    },
  ) {
    const companyId = this.dataStore.getCompanyIdByToken(companyToken);
    if (!companyId) {
      return { ok: false, message: 'Firma oturumu gecersiz' };
    }

    const plate = input.plate.trim().toUpperCase();
    const busType = input.busType.trim();
    const seatLayout = input.seatLayout;
    const seatRows = Number(input.seatRows);
    const seatsTotal = this.getColumnsByLayout(seatLayout) * seatRows;

    if (
      !plate ||
      !busType ||
      !['2+2', '2+1', '1+1'].includes(seatLayout) ||
      !Number.isFinite(seatRows) ||
      seatRows < 4
    ) {
      return { ok: false, message: 'Arac bilgileri gecersiz' };
    }

    const db = this.dataStore.readData();
    const vehicle: CompanyVehicle = {
      id: `BUS-${Date.now().toString().slice(-6)}`,
      companyId,
      plate,
      busType,
      seatsTotal,
      seatLayout,
      seatRows,
      createdAt: new Date().toISOString(),
    };

    db.vehicles.unshift(vehicle);
    this.dataStore.saveData(db);
    return { ok: true, vehicle };
  }

  getTrips(companyToken: string) {
    const companyId = this.dataStore.getCompanyIdByToken(companyToken);
    if (!companyId) {
      return { ok: false, message: 'Firma oturumu gecersiz' };
    }

    const db = this.dataStore.readData();
    return {
      ok: true,
      trips: db.trips.filter((item) => item.companyId === companyId),
    };
  }

  addTrip(
    companyToken: string,
    input: {
      from: string;
      to: string;
      departureDate: string;
      arrivalDate: string;
      departureTime: string;
      durationMinutes: number;
      price: number;
      vehicleId: string;
    },
  ) {
    const companyId = this.dataStore.getCompanyIdByToken(companyToken);
    if (!companyId) {
      return { ok: false, message: 'Firma oturumu gecersiz' };
    }

    const db = this.dataStore.readData();
    const company = db.companies.find((item) => item.id === companyId);
    if (!company) {
      return { ok: false, message: 'Firma bulunamadi' };
    }

    const vehicle = db.vehicles.find(
      (item) => item.id === input.vehicleId && item.companyId === companyId,
    );
    if (!vehicle) {
      return { ok: false, message: 'Arac bulunamadi' };
    }

    const trip: Trip = {
      id: `TRP-${Date.now().toString().slice(-6)}`,
      companyId,
      company: company.companyName,
      from: input.from.trim(),
      to: input.to.trim(),
      departureDate: input.departureDate.trim(),
      arrivalDate: input.arrivalDate.trim(),
      departureTime: input.departureTime.trim(),
      durationMinutes: Number(input.durationMinutes),
      price: Number(input.price),
      busType: vehicle.busType,
      rating: 4.0,
      seatsTotal: vehicle.seatsTotal,
      seatLayout: vehicle.seatLayout,
    };

    if (
      !trip.from ||
      !trip.to ||
      !trip.departureDate ||
      !trip.arrivalDate ||
      !trip.departureTime ||
      !Number.isFinite(trip.durationMinutes) ||
      !Number.isFinite(trip.price) ||
      !Number.isFinite(trip.seatsTotal)
    ) {
      return { ok: false, message: 'Sefer bilgileri gecersiz' };
    }

    db.trips.unshift(trip);
    this.dataStore.saveData(db);
    return { ok: true, trip };
  }
}
