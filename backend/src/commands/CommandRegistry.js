/**
 * CommandRegistry — Command Pattern (registry / command map)
 *
 * Maps each MobilityRequest type string to a pre-constructed command instance.
 * MobilityService is the Receiver injected into every command at startup.
 *
 * Adding a new operation = register one new entry here. No other file changes.
 */
const MobilityService = require('../mvc/MobilityService');

const { GetVehiclesCommand, SearchOptionsCommand } = require('./vehicle.commands');
const {
  CreateBookingDraftCommand,
  ConfirmBookingCommand,
  CompleteBookingCommand,
  GetMyBookingsCommand,
} = require('./booking.commands');
const {
  GetProviderVehiclesCommand,
  AddVehicleCommand,
  UpdateVehicleCommand,
  DeactivateVehicleCommand,
} = require('./provider.commands');
const {
  GetParkingFacilitiesCommand,
  GetFacilitySpotsCommand,
  GetAvailableSpotsCommand,
  ReserveParkingSpotCommand,
  ReleaseParkingSpotCommand,
} = require('./parking.commands');
const { GetTransitScheduleCommand, GetNearbyStopsCommand } = require('./transit.commands');
const { GetRentalAnalyticsCommand, GetGatewayAnalyticsCommand } = require('./analytics.commands');

const registry = new Map([
  // Vehicles
  ['GET_VEHICLES',            new GetVehiclesCommand(MobilityService)],
  ['SEARCH_OPTIONS',          new SearchOptionsCommand(MobilityService)],

  // Booking lifecycle
  ['CREATE_BOOKING_DRAFT',    new CreateBookingDraftCommand(MobilityService)],
  ['CONFIRM_BOOKING',         new ConfirmBookingCommand(MobilityService)],
  ['COMPLETE_BOOKING',        new CompleteBookingCommand(MobilityService)],
  ['GET_MY_BOOKINGS',         new GetMyBookingsCommand(MobilityService)],

  // Provider vehicle management
  ['GET_PROVIDER_VEHICLES',   new GetProviderVehiclesCommand(MobilityService)],
  ['ADD_VEHICLE',             new AddVehicleCommand(MobilityService)],
  ['UPDATE_VEHICLE',          new UpdateVehicleCommand(MobilityService)],
  ['DEACTIVATE_VEHICLE',      new DeactivateVehicleCommand(MobilityService)],

  // Parking
  ['GET_PARKING_FACILITIES',  new GetParkingFacilitiesCommand(MobilityService)],
  ['GET_FACILITY_SPOTS',      new GetFacilitySpotsCommand(MobilityService)],
  ['GET_AVAILABLE_SPOTS',     new GetAvailableSpotsCommand(MobilityService)],
  ['RESERVE_PARKING_SPOT',    new ReserveParkingSpotCommand(MobilityService)],
  ['RELEASE_PARKING_SPOT',    new ReleaseParkingSpotCommand(MobilityService)],

  // Transit
  ['GET_TRANSIT_SCHEDULE',    new GetTransitScheduleCommand(MobilityService)],
  ['GET_NEARBY_STOPS',        new GetNearbyStopsCommand(MobilityService)],

  // Analytics
  ['GET_RENTAL_ANALYTICS',    new GetRentalAnalyticsCommand(MobilityService)],
  ['GET_GATEWAY_ANALYTICS',   new GetGatewayAnalyticsCommand(MobilityService)],
]);

module.exports = registry;
