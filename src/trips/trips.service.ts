import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../common/data/data-store.service';

@Injectable()
export class TripsService {
  constructor(private readonly dataStore: DataStoreService) {}

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
        const booked = this.dataStore.getBookedSeats(db.bookings, trip.id).size;
        return {
          ...trip,
          seatsAvailable: Math.max(0, trip.seatsTotal - booked),
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
    return {
      found: true,
      tripId,
      seats: this.dataStore.toSeats(trip, bookedSeats),
    };
  }
}
