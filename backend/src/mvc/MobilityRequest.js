/**
 * MobilityRequest — MVC Model (Input DTO)
 *
 * Represents the input data for any system operation.
 * Created by MobilityController and passed to MobilityRequestHandler.
 *
 * Flow: View → Controller → [MobilityRequest] → MobilityRequestHandler
 */
class MobilityRequest {
  /**
   * @param {string} type    - Operation type (see MobilityRequest.TYPES)
   * @param {string} userId  - Firebase UID of the requesting user (from token)
   * @param {object} payload - Operation-specific input data
   */
  constructor(type, userId, payload = {}) {
    this.type = type;
    this.userId = userId;
    this.payload = payload;
    this.timestamp = new Date().toISOString();
  }
}

MobilityRequest.TYPES = Object.freeze({
  // Rental lifecycle
  SEARCH_OPTIONS:       'SEARCH_OPTIONS',
  CREATE_BOOKING_DRAFT: 'CREATE_BOOKING_DRAFT',
  CONFIRM_BOOKING:      'CONFIRM_BOOKING',
  COMPLETE_BOOKING:     'COMPLETE_BOOKING',
  GET_MY_BOOKINGS:      'GET_MY_BOOKINGS',

  // Vehicles
  GET_VEHICLES:         'GET_VEHICLES',

  // User
  REGISTER_USER:        'REGISTER_USER',
  GET_PROFILE:          'GET_PROFILE',

  // Provider vehicle management
  GET_PROVIDER_VEHICLES:  'GET_PROVIDER_VEHICLES',
  ADD_VEHICLE:            'ADD_VEHICLE',
  UPDATE_VEHICLE:         'UPDATE_VEHICLE',
  DEACTIVATE_VEHICLE:     'DEACTIVATE_VEHICLE',

  // Parking
  GET_PARKING_FACILITIES:  'GET_PARKING_FACILITIES',
  GET_FACILITY_SPOTS:      'GET_FACILITY_SPOTS',
  GET_AVAILABLE_SPOTS:     'GET_AVAILABLE_SPOTS',
  RESERVE_PARKING_SPOT:    'RESERVE_PARKING_SPOT',
  RELEASE_PARKING_SPOT:    'RELEASE_PARKING_SPOT',
  GET_NEARBY_PARKINGS:     'GET_NEARBY_PARKINGS',

  // Transit
  GET_TRANSIT_SCHEDULE: 'GET_TRANSIT_SCHEDULE',
  GET_NEARBY_STOPS:     'GET_NEARBY_STOPS',

  // Analytics
  GET_RENTAL_ANALYTICS:  'GET_RENTAL_ANALYTICS',
  GET_GATEWAY_ANALYTICS: 'GET_GATEWAY_ANALYTICS',
});

module.exports = MobilityRequest;
