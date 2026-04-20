import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../common/data/data-store.service';

@Injectable()
export class TripsService {
  constructor(private readonly dataStore: DataStoreService) {}

  private normalizeSeatNumber(seatNumber: string): string {
    return seatNumber.trim().toUpperCase();
  }

  searchTrips(from?: string, to?: string, date?: string) {
    const db = this.dataStore.readData();
    return db.trips
      .filter((trip) => {
        const matchFrom = from
          ? trip.from.toLowerCase() === from.toLowerCase()
          : true;
        const matchTo = to ? trip.to.toLowerCase() === to.toLowerCase() : true;
        const matchDate = date ? trip.departureDate === date : true;
        return matchFrom && matchTo && matchDate;
      })
      .map((trip) => {
        const bookedSeats = this.dataStore.getBookedSeats(db.bookings, trip.id);
        const heldSeats = this.dataStore.getHeldSeats(trip.id);
        const heldOnlyCount = Array.from(heldSeats).filter(
          (seatNumber) => !bookedSeats.has(seatNumber),
        ).length;
        return {
          ...trip,
          seatsAvailable: Math.max(
            0,
            trip.seatsTotal - bookedSeats.size - heldOnlyCount,
          ),
        };
      });
  }

  getSeats(tripId: string) {
    const db = this.dataStore.readData();
    const trip = db.trips.find((item) => item.id === tripId);
    if (!trip) {
      return { found: false, message: 'Sefer bulunamadı' };
    }

    const bookedSeats = this.dataStore.getBookedSeats(db.bookings, tripId);
    const heldSeats = this.dataStore.getHeldSeats(tripId);
    return {
      found: true,
      tripId,
      seats: this.dataStore.toSeats(trip, bookedSeats).map((seat) => {
        if (seat.status === 'available' && heldSeats.has(seat.seatNumber)) {
          return {
            ...seat,
            status: 'held' as const,
          };
        }

        return seat;
      }),
    };
  }

  holdSeat(tripId: string, seatNumber: string, holderId?: string) {
    const db = this.dataStore.readData();
    const trip = db.trips.find((item) => item.id === tripId);
    if (!trip) {
      return { ok: false, message: 'Sefer bulunamadı' };
    }

    const normalizedHolderId = holderId?.trim();
    if (!normalizedHolderId) {
      return { ok: false, message: 'Koltuk kilitlemek için oturum gerekli' };
    }

    const normalizedSeatNumber = this.normalizeSeatNumber(seatNumber);
    const bookedSeats = this.dataStore.getBookedSeats(db.bookings, tripId);
    const seats = this.dataStore.toSeats(trip, bookedSeats);
    const seatExists = seats.some(
      (seat) => seat.seatNumber === normalizedSeatNumber,
    );

    if (!seatExists) {
      return { ok: false, message: 'Geçersiz koltuk numarası' };
    }

    if (bookedSeats.has(normalizedSeatNumber)) {
      return { ok: false, message: 'Koltuk daha önce rezerve edilmiş' };
    }

    return this.dataStore.holdSeat(tripId, normalizedSeatNumber, normalizedHolderId);
  }

  releaseSeat(tripId: string, seatNumber: string, holderId?: string) {
    const normalizedSeatNumber = this.normalizeSeatNumber(seatNumber);
    this.dataStore.releaseSeatHold(tripId, normalizedSeatNumber, holderId?.trim());
    return { ok: true };
  }
}
