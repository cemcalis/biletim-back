import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from './trip.entity';
import { Booking } from './booking.entity';

export enum SeatStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  BLOCKED = 'blocked',
}

@Entity('seats')
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10 })
  seatNumber!: string;

  @Column({ type: 'int' })
  seatRow!: number;

  @Column({ type: 'int' })
  seatColumn!: number;

  @ManyToOne(() => Trip, (trip) => trip.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip!: Trip;

  @Column({ type: 'varchar', length: 100 })
  tripId!: string;

  @ManyToOne(() => Booking, (booking) => booking.seats, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'bookingId' })
  booking?: Booking;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bookingId?: string;

  @Column({ type: 'enum', enum: SeatStatus, default: SeatStatus.AVAILABLE })
  status!: SeatStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
