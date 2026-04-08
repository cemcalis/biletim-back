import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Route } from './entities/route.entity';
import { Trip } from './entities/trip.entity';
import { Booking } from './entities/booking.entity';
import { Company } from './entities/company.entity';
import { Seat } from './entities/seat.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'bustour_db',
      entities: [User, Route, Trip, Booking, Company, Seat],
      synchronize: process.env.NODE_ENV === 'development',
      logging:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn', 'info']
          : ['error'],
      dropSchema: false,
      migrationsRun: false,
      migrations: ['dist/database/migrations/*.js'],
      extra: {
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      },
    }),
    TypeOrmModule.forFeature([User, Route, Trip, Booking, Company, Seat]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
