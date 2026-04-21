export type BookingStatus = 'Confirmed' | 'Completed' | 'Canceled';
export type CompanyStatus = 'pending' | 'approved' | 'rejected';
export type TripApprovalStatus = 'pending' | 'approved' | 'rejected';
export type AdminRole = 'super-admin' | 'company-admin';

export type RouteSummary = {
  from: string;
  to: string;
  basePrice: number;
  durationMinutes: number;
};

export type Trip = {
  id: string;
  tripCode?: string;
  companyId: string;
  company: string;
  vehicleId?: string;
  from: string;
  to: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  durationMinutes: number;
  price: number;
  busType: string;
  rating: number;
  seatsTotal: number;
  seatLayout: '2+2' | '2+1' | '1+1';
  isActive?: boolean;
  approvalStatus?: TripApprovalStatus;
  createdAt?: string;
};

export type BookingInput = {
  tripId: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  holderId?: string;
  seatNumber?: string;
  seatNumbers?: string[];
  passengers?: number;
  travelDate?: string;
};

export type BookingRecord = {
  bookingCode: string;
  tripId: string;
  route: string;
  company: string;
  seatNumber: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone?: string;
  totalPrice: number;
  status: BookingStatus;
  passengers: number;
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  createdAt: string;
};

export type CompanyAccount = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  password: string;
  status: CompanyStatus;
  createdAt: string;
  approvedAt?: string;
};

export type CompanyVehicle = {
  id: string;
  companyId: string;
  plate: string;
  busType: string;
  seatsTotal: number;
  seatLayout: '2+2' | '2+1' | '1+1';
  seatRows: number;
  createdAt: string;
};

export type SeatInfo = {
  seatNumber: string;
  status: 'available' | 'booked' | 'held';
};

export type PersistedData = {
  cities: string[];
  routes: RouteSummary[];
  trips: Trip[];
  bookings: BookingRecord[];
  companies: CompanyAccount[];
  vehicles: CompanyVehicle[];
};
