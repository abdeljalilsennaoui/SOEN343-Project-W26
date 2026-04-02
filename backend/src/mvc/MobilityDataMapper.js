/**
 * MobilityDataMapper — MVC Model (Data Mapping)
 *
 * Maps raw Firestore document records to domain entity objects and vice versa.
 * Ensures that persistence format changes do not propagate into the domain layer.
 *
 * Flow: SUMMSDatabase → MobilityDataGateway → [MobilityDataMapper] → MobilityEntities
 */
class MobilityDataMapper {
  /** Map a raw Firestore vehicle document to a Vehicle domain entity. */
  static toVehicle(doc) {
    return {
      id: doc.id,
      city: doc.city,
      type: doc.type,
      pricePerMin: doc.pricePerMin,
      lat: doc.lat ?? null,
      lng: doc.lng ?? null,
      status: doc.status,
      providerId: doc.providerId || null,
      description: doc.description || '',
      createdAt: doc.createdAt || null,
    };
  }

  /** Map a raw Firestore booking document to a Booking domain entity. */
  static toBooking(doc) {
    return {
      id: doc.id,
      userId: doc.userId,
      optionId: doc.optionId,
      startTime: doc.startTime,
      endTime: doc.endTime,
      pickupLocation: doc.pickupLocation,
      totalPrice: doc.totalPrice,
      status: doc.status,
      rideSharing: doc.rideSharing ?? false,
      maxPassengers: doc.maxPassengers ?? 0,
      passengers: doc.passengers ?? [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /** Map a raw Firestore user document to a User domain entity. */
  static toUser(doc) {
    return {
      uid: doc.uid,
      email: doc.email || '',
      displayName: doc.displayName || '',
      role: doc.role,
      createdAt: doc.createdAt || null,
    };
  }

  /** Map a raw Firestore mobilityOption document to a MobilityOption entity. */
  static toMobilityOption(doc) {
    return {
      id: doc.id,
      city: doc.city,
      type: doc.type,
      basePrice: doc.basePrice,
      capacity: doc.capacity ?? 1,
      description: doc.description || '',
      providerId: doc.providerId || null,
      blockedPeriods: doc.blockedPeriods || [],
    };
  }

  /** Map a raw Firestore parking spot document to a ParkingSpot entity. */
  static toParkingSpot(doc) {
    return {
      id: doc.id,
      facilityId: doc.facilityId,
      status: doc.status,
      city: doc.city || null,
    };
  }

  /** Map a domain Vehicle entity back to a Firestore-ready document. */
  static fromVehicle(entity) {
    return {
      city: entity.city,
      type: entity.type,
      pricePerMin: entity.pricePerMin,
      lat: entity.lat,
      lng: entity.lng,
      status: entity.status,
      providerId: entity.providerId,
      description: entity.description || '',
    };
  }

  /** Map a domain Booking entity back to a Firestore-ready document. */
  static fromBooking(entity) {
    return {
      userId: entity.userId,
      optionId: entity.optionId,
      startTime: entity.startTime,
      endTime: entity.endTime,
      pickupLocation: entity.pickupLocation,
      totalPrice: entity.totalPrice,
      status: entity.status,
    };
  }
}

module.exports = MobilityDataMapper;
