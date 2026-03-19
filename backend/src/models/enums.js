const VehicleStatus = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  IN_USE: 'IN_USE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
});

const PaymentStatus = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

const TripMode = Object.freeze({
  CAR_SHARING: 'CAR_SHARING',
  BIKE_SHARING: 'BIKE_SHARING',
  SCOOTER_SHARING: 'SCOOTER_SHARING',
  BUS: 'BUS',
  METRO: 'METRO',
  TRAM: 'TRAM',
});

const ParkingStatus = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
});

const ReservationStatus = Object.freeze({
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

const UserRole = Object.freeze({
  COMMUTER: 'COMMUTER',
  MOBILITY_PROVIDER: 'MOBILITY_PROVIDER',
  CITY_ADMINISTRATOR: 'CITY_ADMINISTRATOR',
  SYSTEM_ADMINISTRATOR: 'SYSTEM_ADMINISTRATOR',
});

const BookingStatus = Object.freeze({
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED',
});

const ReceiptStatus = Object.freeze({
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
});

module.exports = {
  VehicleStatus,
  PaymentStatus,
  TripMode,
  ParkingStatus,
  ReservationStatus,
  UserRole,
  BookingStatus,
  ReceiptStatus,
};
