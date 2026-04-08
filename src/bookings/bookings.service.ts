import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../common/data/data-store.service';
import { BookingInput, BookingRecord } from '../common/types';

@Injectable()
export class BookingsService {
  constructor(private readonly dataStore: DataStoreService) {}

  getBookings(passengerEmail?: string): BookingRecord[] {
    const db = this.dataStore.readData();
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
    const db = this.dataStore.readData();
    return (
      db.bookings.find((booking) => booking.bookingCode === bookingCode) ?? null
    );
  }

  cancelBooking(bookingCode: string) {
    const db = this.dataStore.readData();
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
    this.dataStore.saveData(db);
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
    const db = this.dataStore.readData();
    const trip = db.trips.find((item) => item.id === input.tripId);
    if (!trip) {
      return { ok: false, message: 'Sefer bulunamadı' };
    }

    const bookedSeats = this.dataStore.getBookedSeats(
      db.bookings,
      input.tripId,
    );
    const seats = this.dataStore.toSeats(trip, bookedSeats);
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
    this.dataStore.saveData(db);

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
}
