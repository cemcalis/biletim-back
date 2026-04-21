import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../common/data/data-store.service';
import { BookingInput, BookingRecord } from '../common/types';

@Injectable()
export class BookingsService {
  private bookingCreationLock: Promise<void> = Promise.resolve();

  constructor(private readonly dataStore: DataStoreService) {}

  private async withBookingCreationLock<T>(
    operation: () => T | Promise<T>,
  ): Promise<T> {
    const previous = this.bookingCreationLock;
    let release!: () => void;
    this.bookingCreationLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  getBookings(passengerEmail?: string): BookingRecord[] {
    if (!passengerEmail?.trim()) {
      return [];
    }

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
        `Telefon: ${booking.passengerPhone ?? '-'}`,
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

  async createBooking(input: BookingInput) {
    return this.withBookingCreationLock(() => {
      const db = this.dataStore.readData();
      const trip = db.trips.find((item) => item.id === input.tripId);
      if (!trip) {
        return { ok: false, message: 'Sefer bulunamadı' };
      }

      const passengerEmail = String(input.passengerEmail ?? '')
        .trim()
        .toLowerCase();
      const passengerPhone = String(input.passengerPhone ?? '').trim();
      const holderId = String(input.holderId ?? '').trim() || passengerEmail;
      const rawSeats = input.seatNumbers?.length
        ? input.seatNumbers
        : input.seatNumber
          ? [input.seatNumber]
          : [];
      const requestedSeats = Array.from(
        new Set(
          rawSeats
            .filter(Boolean)
            .map((seatNumber) => (seatNumber ?? '').trim().toUpperCase()),
        ),
      );

      if (requestedSeats.length === 0) {
        return { ok: false, message: 'En az bir koltuk seçilmelidir' };
      }

      const bookedSeats = this.dataStore.getBookedSeats(
        db.bookings,
        input.tripId,
      );
      const seats = this.dataStore.toSeats(trip, bookedSeats);

      for (const seatNumber of requestedSeats) {
        const seatExists = seats.some((seat) => seat.seatNumber === seatNumber);
        if (!seatExists) {
          return {
            ok: false,
            message: `Geçersiz koltuk numarası: ${seatNumber}`,
          };
        }
        if (
          this.dataStore.isSeatHeldByAnother(input.tripId, seatNumber, holderId)
        ) {
          return {
            ok: false,
            message: `Koltuk şu anda başka bir kullanıcı tarafından seçili: ${seatNumber}`,
          };
        }
        if (bookedSeats.has(seatNumber)) {
          return {
            ok: false,
            message: `Koltuk daha önce rezerve edilmiş: ${seatNumber}`,
          };
        }
      }

      const bookingCodePrefix = `RB-${Date.now().toString().slice(-8)}`;
      const createdAt = new Date().toISOString();
      const newBookings = requestedSeats.map((seatNumber, index) => ({
        bookingCode:
          requestedSeats.length === 1
            ? bookingCodePrefix
            : `${bookingCodePrefix}-${index + 1}`,
        tripId: trip.id,
        route: `${trip.from} - ${trip.to}`,
        company: trip.company,
        seatNumber,
        passengerName: input.passengerName.trim(),
        passengerEmail,
        passengerPhone,
        totalPrice: trip.price,
        status: 'Confirmed' as const,
        passengers: 1,
        travelDate: input.travelDate ?? new Date().toISOString().slice(0, 10),
        departureTime: trip.departureTime,
        arrivalTime: 'Tahmini',
        createdAt,
      }));

      db.bookings.unshift(...newBookings);
      this.dataStore.saveData(db);
      requestedSeats.forEach((seatNumber) => {
        this.dataStore.releaseSeatHold(input.tripId, seatNumber, holderId);
      });

      return {
        ok: true,
        bookingCode: newBookings[0].bookingCode,
        bookingCodes: newBookings.map((booking) => booking.bookingCode),
        tripId: trip.id,
        seatNumber: newBookings[0].seatNumber,
        seatNumbers: requestedSeats,
        passengerName: newBookings[0].passengerName,
        passengerEmail: newBookings[0].passengerEmail,
        passengerPhone: newBookings[0].passengerPhone,
        totalPrice: newBookings.reduce(
          (sum, booking) => sum + booking.totalPrice,
          0,
        ),
        status: newBookings[0].status,
      };
    });
  }
}
