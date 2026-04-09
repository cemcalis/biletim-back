import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Company } from '../entities/company.entity';
import { Route } from '../entities/route.entity';
import { Trip } from '../entities/trip.entity';
import { Seat, SeatStatus } from '../entities/seat.entity';
import { Booking } from '../entities/booking.entity';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'bustour_user',
  password: process.env.DB_PASSWORD || 'bustour_password',
  database: process.env.DB_NAME || 'bustour_db',
  entities: [User, Company, Route, Trip, Seat, Booking],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();

  try {
    console.log('🌱 Starting database seeding...');

    // Create sample route
    const routeRepository = AppDataSource.getRepository(Route);
    const sampleRoute = routeRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440001',
      from: 'Ankara',
      to: 'İstanbul',
      basePrice: 450,
      durationMinutes: 210,
      isActive: true,
    });
    await routeRepository.save(sampleRoute);
    console.log('✅ Route created');

    // Create sample company
    const companyRepository = AppDataSource.getRepository(Company);
    const sampleCompany = companyRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440002',
      companyName: 'RedBus Travels',
      contactName: 'John Doe',
      email: 'company@redbusravels.com',
      password: 'Company123!',
      vehicleCount: 5,
      isApproved: true,
      isActive: true,
    });
    await companyRepository.save(sampleCompany);
    console.log('✅ Company created');

    // Create sample trip
    const tripRepository = AppDataSource.getRepository(Trip);
    const today = new Date().toISOString().slice(0, 10);
    const sampleTrip = tripRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440003',
      tripCode: 'RB-ANK-IST-001',
      company: sampleCompany,
      route: sampleRoute,
      from: 'Ankara',
      to: 'İstanbul',
      departureDate: today,
      arrivalDate: today,
      departureTime: '10:30',
      durationMinutes: 210,
      price: 850,
      busType: 'Çift Katlı Mercedes',
      rating: 4.5,
      seatsTotal: 40,
      seatsBooked: 0,
      isActive: true,
    });
    const savedTrip = await tripRepository.save(sampleTrip);
    console.log('✅ Trip created');

    // Create sample seats
    const seatRepository = AppDataSource.getRepository(Seat);
    const seats: Seat[] = [];
    for (let row = 1; row <= 4; row++) {
      for (let col = 1; col <= 10; col++) {
        const seat = seatRepository.create({
          seatNumber: `${row}${String.fromCharCode(64 + col)}`,
          seatRow: row,
          seatColumn: col,
          trip: savedTrip,
          status: SeatStatus.AVAILABLE,
        });
        seats.push(seat);
      }
    }
    await seatRepository.save(seats);
    console.log(`✅ ${seats.length} seats created`);

    // Create sample user
    const userRepository = AppDataSource.getRepository(User);
    const sampleUser = userRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Test User',
      email: 'user@example.com',
      password: 'User123!',
      phone: '05001234567',
      isCompany: false,
    });
    await userRepository.save(sampleUser);
    console.log('✅ User created');

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

void seed();
