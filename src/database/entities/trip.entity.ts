import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Route } from './route.entity';
import { Company } from './company.entity';
import { Booking } from './booking.entity';
import { Seat } from './seat.entity';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  tripCode!: string;

  @ManyToOne(() => Company, (company) => company.trips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @Column({ type: 'varchar', length: 100 })
  companyId!: string;

  @ManyToOne(() => Route, (route) => route.trips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routeId' })
  route!: Route;

  @Column({ type: 'varchar', length: 100 })
  routeId!: string;

  @Column({ type: 'varchar', length: 100 })
  from!: string;

  @Column({ type: 'varchar', length: 100 })
  to!: string;

  @Column({ type: 'date' })
  departureDate!: string;

  @Column({ type: 'date' })
  arrivalDate!: string;

  @Column({ type: 'time' })
  departureTime!: string;

  @Column({ type: 'int' })
  durationMinutes!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'varchar', length: 255 })
  busType!: string;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  rating!: number;

  @Column({ type: 'int' })
  seatsTotal!: number;

  @Column({ type: 'varchar', length: 10, default: '2+2' })
  seatLayout!: string;

  @Column({ type: 'int', default: 0 })
  seatsBooked!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Booking, (booking) => booking.trip)
  bookings!: Booking[];

  @OneToMany(() => Seat, (seat) => seat.trip)
  seats!: Seat[];

  getAvailableSeats(): number {
    return this.seatsTotal - this.seatsBooked;
  }
}
