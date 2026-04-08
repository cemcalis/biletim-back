-- Bus Booking System - Database Initialization Script
-- This script is automatically run when the MySQL container starts

-- Set character set for all connections
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS bustour_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bustour_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  isCompany BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Routes Table
CREATE TABLE IF NOT EXISTS routes (
  id VARCHAR(36) PRIMARY KEY,
  `from` VARCHAR(100) NOT NULL,
  `to` VARCHAR(100) NOT NULL,
  basePrice DECIMAL(10, 2) NOT NULL,
  durationMinutes INT NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_from_to (`from`, `to`),
  INDEX idx_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(36) PRIMARY KEY,
  companyName VARCHAR(255) NOT NULL UNIQUE,
  contactName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  description TEXT,
  vehicleCount INT DEFAULT 0,
  isApproved BOOLEAN DEFAULT FALSE,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_approved (isApproved),
  INDEX idx_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trips Table
CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(36) PRIMARY KEY,
  tripCode VARCHAR(50) NOT NULL UNIQUE,
  companyId VARCHAR(36) NOT NULL,
  routeId VARCHAR(36) NOT NULL,
  `from` VARCHAR(100) NOT NULL,
  `to` VARCHAR(100) NOT NULL,
  departureTime TIME NOT NULL,
  durationMinutes INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  busType VARCHAR(255) NOT NULL,
  rating DECIMAL(3, 1) NOT NULL,
  seatsTotal INT NOT NULL,
  seatsBooked INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_tripCode (tripCode),
  INDEX idx_companyId (companyId),
  INDEX idx_routeId (routeId),
  INDEX idx_from_to (`from`, `to`),
  INDEX idx_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY,
  bookingCode VARCHAR(50) NOT NULL UNIQUE,
  userId VARCHAR(36) NOT NULL,
  tripId VARCHAR(36) NOT NULL,
  numberOfSeats INT NOT NULL,
  totalPrice DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
  INDEX idx_bookingCode (bookingCode),
  INDEX idx_userId (userId),
  INDEX idx_tripId (tripId),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seats Table
CREATE TABLE IF NOT EXISTS seats (
  id VARCHAR(36) PRIMARY KEY,
  seatNumber VARCHAR(10) NOT NULL,
  seatRow INT NOT NULL,
  seatColumn INT NOT NULL,
  tripId VARCHAR(36) NOT NULL,
  bookingId VARCHAR(36),
  status ENUM('available', 'booked', 'blocked') DEFAULT 'available',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE CASCADE,
  UNIQUE KEY unique_seat_per_trip (tripId, seatNumber),
  INDEX idx_tripId (tripId),
  INDEX idx_bookingId (bookingId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX idx_trips_departure ON trips(departureTime);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_seats_status ON seats(status);

-- Sample data for testing (optional)
-- INSERT INTO users (id, name, email, password, phone) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440001', 'Test User', 'user@example.com', '$2b$10$...', '05001234567');

COMMIT;
