import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './admin/admin.module';
import { BookingsModule } from './bookings/bookings.module';
import { CommonModule } from './common/common.module';
import { CompanyModule } from './company/company.module';
import { HealthModule } from './health/health.module';
import { RoutesModule } from './routes/routes.module';
import { TripsModule } from './trips/trips.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CommonModule,
    HealthModule,
    RoutesModule,
    AdminModule,
    CompanyModule,
    TripsModule,
    BookingsModule,
    UsersModule,
  ],
})
export class AppModule {}
