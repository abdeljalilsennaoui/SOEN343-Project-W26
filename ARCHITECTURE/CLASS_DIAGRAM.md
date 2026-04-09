# SUMMS — Class Diagram (MVC Architecture)

> Reflects the MVC architecture used in the SUMMS system.
> Organized by the three MVC components: Model, View, Controller.

---

## MVC Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         VIEW LAYER                           │
│                    (React Frontend)                          │
│                                                             │
│   CommuterUI          ProviderDashboardView  AdminDashboardView│
│   CommuterWebView     ProviderWebView        AnalyticsReportView│
│   (BookingFlow, VehicleList, ParkingPage, TransitPage,      │
│    MyBookings, RideShare, Register, Login,                  │
│    ProviderDashboard, VehicleForm)                          │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTP request / JSON response
┌───────────────────▼─────────────────────────────────────────┐
│                      CONTROLLER LAYER                        │
│                                                             │
│   MobilityController      MobilityPresenter                  │
│   (mvc/MobilityController.js)  (mvc/MobilityPresenter.js)   │
└───────────────────┬─────────────────────────────────────────┘
                    │ MobilityRequest / MobilityResponse
┌───────────────────▼─────────────────────────────────────────┐
│                        MODEL LAYER                           │
│                                                             │
│   MobilityRequest         MobilityRequestHandler            │
│   MobilityResponse        MobilityService                   │
│   MobilityEntities        MobilityDataGateway               │
│   MobilityDataMapper      SUMMSDatabase (Firestore)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Request Flow

```
User Action (CommuterUI / ProviderDashboardView / AdminDashboardView)
       ↓
View sends HTTP request
       ↓
MobilityController receives request, creates MobilityRequest
       ↓
MobilityRequestHandler.handle(request)
       ↓
MobilityService executes business logic
       ↓
MobilityDataGateway queries SUMMSDatabase
       ↓
MobilityDataMapper converts records to MobilityEntities
       ↓
MobilityResponse returned to MobilityRequestHandler
       ↓
MobilityController forwards to MobilityPresenter
       ↓
MobilityPresenter formats ViewModel
       ↓
View displays result to user
```

---

## CONTROLLER Layer

### MobilityController
```
┌─────────────────────────────────────────────────────┐
│              MobilityController                      │
│  (backend/src/mvc/MobilityController.js)             │
│─────────────────────────────────────────────────────│
│ - handler: MobilityRequestHandler                    │
│ - presenter: MobilityPresenter                       │
│─────────────────────────────────────────────────────│
│ + getVehicles(req, res, next)                        │
│ + searchOptions(req, res, next)                      │
│ + createDraft(req, res, next)                        │
│ + confirmDraft(req, res, next)                       │
│ + completeBooking(req, res, next)                    │
│ + getMyBookings(req, res, next)                      │
│ + getProviderVehicles(req, res, next)                │
│ + addVehicle(req, res, next)                         │
│ + updateVehicle(req, res, next)                      │
│ + deactivateVehicle(req, res, next)                  │
│ + getParkingFacilities(req, res, next)               │
│ + getFacilitySpots(req, res, next)                   │
│ + getAvailableSpots(req, res, next)                  │
│ + reserveParkingSpot(req, res, next)                 │
│ + releaseParkingSpot(req, res, next)                 │
│ + getNearbyParkings(req, res, next)                  │
│ + getTransitSchedule(req, res, next)                 │
│ + getNearbyStops(req, res, next)                     │
│ + getRentalAnalytics(req, res, next)                 │
│ + getGatewayAnalytics(req, res, next)                │
│ + listRideShares(req, res, next)                     │
│ + joinRide(req, res, next)                           │
│ + leaveRide(req, res, next)                          │
│─────────────────────────────────────────────────────│
│  No business logic. Creates MobilityRequest,         │
│  delegates to MobilityRequestHandler, passes         │
│  MobilityResponse to MobilityPresenter.              │
└─────────────────────────────────────────────────────┘
```

### MobilityPresenter
```
┌─────────────────────────────────────────────────────┐
│              MobilityPresenter                       │
│  (backend/src/mvc/MobilityPresenter.js)              │
│─────────────────────────────────────────────────────│
│ + present(response: MobilityResponse): ViewModel     │
│ + presentError(error: Error): ViewModel              │
│─────────────────────────────────────────────────────│
│  Formats MobilityResponse into JSON ViewModels.      │
│  Arrays include count field.                         │
│  Errors formatted as { error: { code, message } }.  │
└─────────────────────────────────────────────────────┘
```

---

## MODEL Layer

### MobilityRequest (Input DTO)
```
┌─────────────────────────────────────────────────────┐
│              MobilityRequest                         │
│  (backend/src/mvc/MobilityRequest.js)                │
│─────────────────────────────────────────────────────│
│ + type: string         (MobilityRequest.TYPES)       │
│ + userId: string       (from Firebase token)         │
│ + payload: object      (operation-specific data)     │
│ + timestamp: string    (ISO creation time)           │
│─────────────────────────────────────────────────────│
│ TYPES: GET_VEHICLES,                                 │
│        SEARCH_OPTIONS, CREATE_BOOKING_DRAFT,         │
│        CONFIRM_BOOKING, COMPLETE_BOOKING,            │
│        GET_MY_BOOKINGS, REGISTER_USER, GET_PROFILE,  │
│        ADD_VEHICLE, UPDATE_VEHICLE,                  │
│        DEACTIVATE_VEHICLE, GET_PROVIDER_VEHICLES,    │
│        GET_PARKING_FACILITIES, GET_FACILITY_SPOTS,   │
│        GET_AVAILABLE_SPOTS,                          │
│        RESERVE_PARKING_SPOT, RELEASE_PARKING_SPOT,   │
│        GET_TRANSIT_SCHEDULE, GET_NEARBY_STOPS,       │
│        GET_RENTAL_ANALYTICS, GET_GATEWAY_ANALYTICS,  │
│        LIST_RIDE_SHARES, JOIN_RIDE, LEAVE_RIDE        │
└─────────────────────────────────────────────────────┘
```

### MobilityResponse (Output DTO)
```
┌─────────────────────────────────────────────────────┐
│              MobilityResponse                        │
│  (backend/src/mvc/MobilityResponse.js)               │
│─────────────────────────────────────────────────────│
│ + success: boolean                                   │
│ + data: any                                          │
│ + error: string | null                               │
│ + statusCode: number                                 │
│─────────────────────────────────────────────────────│
│ + MobilityResponse.ok(data)      → 200               │
│ + MobilityResponse.created(data) → 201               │
│ + MobilityResponse.fail(msg, n)  → n                 │
└─────────────────────────────────────────────────────┘
```

### MobilityRequestHandler
```
┌─────────────────────────────────────────────────────┐
│           MobilityRequestHandler                     │
│  (backend/src/mvc/MobilityRequestHandler.js)         │
│─────────────────────────────────────────────────────│
│ + handle(request: MobilityRequest)                   │
│       : Promise<MobilityResponse>                    │
│─────────────────────────────────────────────────────│
│  Routes each request type to the correct             │
│  MobilityService operation.                          │
│  Does not contain business logic.                    │
└─────────────────────────────────────────────────────┘
```

### MobilityService (Business Logic)
```
┌─────────────────────────────────────────────────────┐
│              MobilityService                         │
│  (backend/src/mvc/MobilityService.js)                │
│─────────────────────────────────────────────────────│
│  Vehicles:                                           │
│ + getVehicles(filters)                               │
│─────────────────────────────────────────────────────│
│  Rental Lifecycle:                                   │
│ + searchVehicles(params)                             │
│ + createReservation({userId, optionId, ...})         │
│ + processPayment(draftId, userId, paymentDetails)    │
│ + returnVehicle(bookingId, userId)                   │
│ + getMyBookings(userId)                              │
│─────────────────────────────────────────────────────│
│  Provider Management:                                │
│ + addVehicle(providerId, data)                       │
│ + updateVehicle(vehicleId, providerId, fields)       │
│ + removeVehicle(vehicleId, providerId)               │
│ + getProviderVehicles(providerId)                    │
│─────────────────────────────────────────────────────│
│  External Services:                                  │
│ + getParkingFacilities(city)                         │
│ + getFacilityWithSpots(facilityId)                   │
│ + getAvailableSpots(city)                            │
│ + reserveParkingSpot(spotId)                         │
│ + releaseParkingSpot(spotId)                         │
│ + getTransitSchedule(city, line)                     │
│ + getNearbyStops(lat, lng)                           │
│─────────────────────────────────────────────────────│
│  Analytics:                                          │
│ + getRentalAnalytics()                               │
│ + getGatewayAnalytics()                              │
│─────────────────────────────────────────────────────│
│  Ride Sharing:                                       │
│ + getActiveRideShares()                              │
│ + joinRide(bookingId, userId)                        │
│ + leaveRide(bookingId, userId)                       │
│─────────────────────────────────────────────────────│
│  Uses: MobilityDataGateway, BookingStateMachine,     │
│        IPaymentGateway (Strategy), EventBus          │
└─────────────────────────────────────────────────────┘
```

### MobilityEntities (Domain Objects)
```
┌───────────────────────┐   ┌───────────────────────┐
│   <<entity>> User     │   │  <<entity>> Vehicle   │
│───────────────────────│   │───────────────────────│
│ uid: string           │   │ id: string            │
│ email: string         │   │ city: string          │
│ displayName: string   │   │ type: TripMode        │
│ role: UserRole        │   │ pricePerMin: number   │
│ createdAt: Timestamp  │   │ providerId: string    │
└───────────────────────┘   │ status: VehicleStatus │
                            └───────────────────────┘

┌───────────────────────┐   ┌───────────────────────┐
│ <<entity>> Booking    │   │ <<entity>> Provider   │
│   (Reservation/Rental)│   │───────────────────────│
│───────────────────────│   │ uid: string           │
│ id: string            │   │ email: string         │
│ userId: string        │   │ role: MOBILITY_PROVIDER│
│ optionId: string      │   └───────────────────────┘
│ startTime: string     │
│ endTime: string       │   ┌───────────────────────┐
│ totalPrice: number    │   │<<entity>>             │
│ status: BookingStatus │   │  PaymentReceipt       │
│ pickupLocation:       │   │───────────────────────│
│   { lat, lng,         │
│     address? }        │
│ rideSharing: boolean  │
│ maxPassengers: number │
│ passengers: string[]  │
└───────────────────────┘   │ id: string            │
                            │ bookingId: string     │
                            │ amount: number        │
                            │ status: ReceiptStatus │
                            └───────────────────────┘

┌───────────────────────┐   ┌───────────────────────┐
│<<entity>>             │   │<<entity>>             │
│  MobilityOption       │   │  ParkingFacility      │
│───────────────────────│   │───────────────────────│
│ id: string            │   │ id: string            │
│ city: string          │   │ city: string          │
│ type: TripMode        │   │ name: string          │
│ basePrice: number     │   │ address: string       │
│ capacity: number      │   └───────────────────────┘
│ description: string   │
│ blockedPeriods: []    │
└───────────────────────┘   ┌───────────────────────┐
                            │<<entity>>             │
                            │  ParkingSpot          │
┌───────────────────────┐   │───────────────────────│
│<<entity>>             │   │ id: string            │
│  AnalyticsEvent       │   │ facilityId: string    │
│───────────────────────│   │ status: ParkingStatus │
│ id: string            │   │ city: string          │
│ type: string          │   └───────────────────────┘
│ city: string          │
│ metadata: object      │
│ timestamp: Timestamp  │
└───────────────────────┘
```

### MobilityDataGateway
```
┌─────────────────────────────────────────────────────┐
│            MobilityDataGateway                       │
│  (backend/src/mvc/MobilityDataGateway.js)            │
│─────────────────────────────────────────────────────│
│  Bookings:                                           │
│ + findBooking(id)                                    │
│ + findBookingsByUser(userId)                         │
│ + saveBooking(data)                                  │
│ + updateBooking(id, updates)                         │
│─────────────────────────────────────────────────────│
│  Vehicles:                                           │
│ + findVehicles(filters)                              │
│ + findVehicle(id)                                    │
│ + saveVehicle(data)                                  │
│ + updateVehicle(id, fields)                          │
│ + deactivateVehicle(id)                              │
│─────────────────────────────────────────────────────│
│  Users:                                              │
│ + findUser(uid)                                      │
│ + saveUser(uid, data)                                │
│─────────────────────────────────────────────────────│
│  Mobility Options:                                   │
│ + findMobilityOptions(filters)                       │
│ + findMobilityOption(id)                             │
│─────────────────────────────────────────────────────│
│  Parking:                                            │
│ + findParkingFacilities(city)                        │
│ + findFacilityWithSpots(facilityId)                  │
│ + findAvailableSpots(city)                           │
│ + reserveSpot(spotId)                                │
│ + releaseSpot(spotId)                                │
│─────────────────────────────────────────────────────│
│  Receipts:                                           │
│ + saveReceipt(data)                                  │
│ + findReceiptByBooking(bookingId)                    │
│─────────────────────────────────────────────────────│
│  Analytics:                                          │
│ + getRentalAnalytics()                               │
│ + getGatewayAnalytics()                              │
│─────────────────────────────────────────────────────│
│  Ride Sharing:                                       │
│ + findActiveRideShares()                             │
│─────────────────────────────────────────────────────│
│  Delegates to: MobilityDataMapper + Firestore models │
└─────────────────────────────────────────────────────┘
```

### MobilityDataMapper
```
┌─────────────────────────────────────────────────────┐
│            MobilityDataMapper                        │
│  (backend/src/mvc/MobilityDataMapper.js)             │
│─────────────────────────────────────────────────────│
│ + toVehicle(doc)       → Vehicle entity              │
│ + toBooking(doc)       → Booking entity              │
│ + toUser(doc)          → User entity                 │
│ + toMobilityOption(doc)→ MobilityOption entity       │
│ + toParkingSpot(doc)   → ParkingSpot entity          │
│ + fromVehicle(entity)  → Firestore document          │
│ + fromBooking(entity)  → Firestore document          │
└─────────────────────────────────────────────────────┘
```

### MobilitySearchService
```
┌─────────────────────────────────────────────────────┐
│          MobilitySearchService                       │
│  (backend/src/services/MobilitySearchService.js)     │
│─────────────────────────────────────────────────────│
│ + search({ city, type?, maxPrice?,                   │
│            startTime, endTime })                     │
│       : Promise<MobilityOptionViewModel[]>           │
│─────────────────────────────────────────────────────│
│  Each result: { optionId, type, city,                │
│                 availability: boolean,               │
│                 remaining: number,                   │
│                 capacity: number,                    │
│                 estimatedPrice, shortDescription }   │
│─────────────────────────────────────────────────────│
│  Uses checkAvailabilityBatch() — single Firestore    │
│  read for all options (replaces N parallel reads).   │
│  Sorted: available first, then price ascending.      │
└─────────────────────────────────────────────────────┘
```

### AvailabilityService
```
┌─────────────────────────────────────────────────────┐
│           AvailabilityService                        │
│  (backend/src/services/AvailabilityService.js)       │
│─────────────────────────────────────────────────────│
│ + isAvailable(option, start, end, excludeId?)        │
│       : Promise<boolean>                             │
│ + checkAvailability(option, start, end, excludeId?)  │
│       : Promise<{ available, remaining,              │
│                   capacity, conflicting }>            │
│ + checkAvailabilityBatch(options[], start, end)      │
│       : Promise<Map<optionId, { available,           │
│                                 remaining,           │
│                                 capacity }>>          │
│─────────────────────────────────────────────────────│
│  Counts DRAFT + ACTIVE bookings in the time window   │
│  against each option's capacity. Single Firestore    │
│  read for the batch variant.                         │
└─────────────────────────────────────────────────────┘
```

### SUMMSDatabase
```
┌─────────────────────────────────────────────────────┐
│              SUMMSDatabase                           │
│  (Google Firestore via lib/firestore.js)             │
│─────────────────────────────────────────────────────│
│  Collections:                                        │
│  users              vehicles                         │
│  bookings           mobilityOptions                  │
│  parkingFacilities  parkingSpots                     │
│  paymentReceipts    analytics                        │
│                                                      │
│  bookings schema includes:                           │
│    rideSharing: boolean                              │
│    maxPassengers: number (0–3)                       │
│    passengers: string[]  (userIds)                   │
│    pickupLocation: { lat, lng, address? }            │
└─────────────────────────────────────────────────────┘
```

---

## VIEW Layer (React Frontend)

### Commuter Views
```
┌───────────────────────┐   ┌───────────────────────┐
│    CommuterUI         │   │  CommuterWebView       │
│  (React pages)        │   │  (api.js HTTP calls)   │
│───────────────────────│   │───────────────────────│
│ BookingFlow.jsx       │   │ createBookingDraft()   │
│ MyBookings.jsx        │   │ confirmBooking()       │
│ ParkingPage.jsx       │   │ completeBooking()      │
│ TransitPage.jsx       │   │ getMyBookings()        │
│ VehicleList.jsx       │   │ searchMobilityOptions()│
│ Map.jsx               │   │ reserveParkingSpot()   │
│ RideShare.jsx         │   │ getTransitSchedule()   │
│ Register.jsx          │   │ listRideShares()       │
│ Login.jsx             │   │ joinRide()             │
│                       │   │ leaveRide()            │
└───────────────────────┘   └───────────────────────┘

┌───────────────────────────────────────────────────┐
│           Map Support Components                   │
│───────────────────────────────────────────────────│
│ useMap.js           — map state + booking logic    │
│ useMapUi.js         — marker icons + InfoWindow    │
│ RideSharingModal.jsx — CAR_SHARING booking modal   │
│                       (rideSharing toggle,         │
│                        maxPassengers, address)     │
└───────────────────────────────────────────────────┘

┌───────────────────────┐   ┌───────────────────────┐
│ CommuterPresenter     │   │  CommuterViewModel     │
│  (AuthContext.jsx,    │   │  (React useState /     │
│   component state)   │   │   component props)     │
└───────────────────────┘   └───────────────────────┘
```

### Provider Views  (role: MOBILITY_PROVIDER)
```
┌───────────────────────┐   ┌───────────────────────┐
│  ProviderDashboardView│   │  ProviderWebView       │
│  ProviderDashboard    │   │  (api.js HTTP calls)   │
│  .jsx                 │   │───────────────────────│
│───────────────────────│   │ addVehicle()           │
│ VehicleForm.jsx       │   │ updateVehicle()        │
│  (add / edit form)    │   │ deactivateVehicle()    │
│ Vehicle list table    │   │ getProviderVehicles()  │
└───────────────────────┘   └───────────────────────┘

┌───────────────────────┐   ┌───────────────────────┐
│ ProviderPresenter     │   │  ProviderViewModel     │
│  (AuthContext,        │   │  (React state in       │
│   component state)   │   │   dashboard pages)     │
└───────────────────────┘   └───────────────────────┘
```

### Admin Views  (role: CITY_ADMINISTRATOR | SYSTEM_ADMINISTRATOR)
```
┌───────────────────────┐   ┌───────────────────────┐
│  AdminDashboardView   │   │  AnalyticsReportView   │
│───────────────────────│   │  Analytics.jsx         │
│ City-level oversight  │   │───────────────────────│
│ Vehicle management    │   │ Rental analytics       │
│ User management       │   │ Gateway analytics      │
└───────────────────────┘   └───────────────────────┘

┌───────────────────────┐   ┌───────────────────────┐
│   AdminPresenter      │   │  AdminViewModel        │
│  (AuthContext,        │   │  (React state in       │
│   component state)   │   │   dashboard pages)     │
└───────────────────────┘   └───────────────────────┘
```

---

## Design Pattern Supporting Classes

### Observer Pattern — EventBus + AnalyticsListener
```
┌─────────────────────────────────────────────────────┐
│              EventBus  (lib/EventBus.js)             │
│          <<Singleton — Node EventEmitter>>           │
│─────────────────────────────────────────────────────│
│ + on(event, handler)                                 │
│ + emit(event, data)                                  │
│─────────────────────────────────────────────────────│
│  Publisher:  MobilityService (emits domain events)   │
│  Subscriber: AnalyticsListener (persists events)     │
│  Registered in: app.js before routes are mounted     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│       AnalyticsListener  (services/AnalyticsListener.js) │
│─────────────────────────────────────────────────────│
│ + register()                                         │
│─────────────────────────────────────────────────────│
│  Subscribes to: RESERVATION_CREATED, BOOKING_CONFIRMED│
│                 PAYMENT_PROCESSED, VEHICLE_RETURNED,  │
│                 PARKING_RESERVED, PARKING_RELEASED,   │
│                 TRANSIT_QUERY, GATEWAY_CALL,          │
│                 RIDE_JOINED                           │
│  Persists to:   AnalyticsReport (Firestore)          │
│  Fire-and-forget: .catch(() => {}) — never blocks    │
└─────────────────────────────────────────────────────┘
```

### State Pattern — BookingStateMachine
```
┌─────────────────────────────────────────────────────┐
│  <<abstract>> BookingState  (lib/states/BookingState.js) │
│─────────────────────────────────────────────────────│
│ + getName(): string                                  │
│ + toActive(context)   → throws ApiError 409          │
│ + toComplete(context) → throws ApiError 409          │
│ + toFailed(context)   → throws ApiError 409          │
└──────────────┬──────────────────────────────────────┘
               │ extends
    ┌──────────┼──────────┬───────────────┐
    ▼          ▼          ▼               ▼
┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐
│DraftState│ │ActiveState│ │CompleteState│ │FailedState│
│──────────│ │──────────│ │───────────│ │───────────│
│DRAFT     │ │ACTIVE    │ │COMPLETE   │ │FAILED     │
│──────────│ │──────────│ │(terminal) │ │(terminal) │
│toActive()│ │toComplete│ │all throw  │ │all throw  │
│→ActiveSt │ │→CompleteSt│ │409        │ │409        │
│toFailed()│ └──────────┘ └───────────┘ └───────────┘
│→FailedSt │
└──────────┘

┌─────────────────────────────────────────────────────┐
│  BookingStateMachine  (lib/BookingStateMachine.js)   │
│          <<Context — exports Class, not instance>>   │
│─────────────────────────────────────────────────────│
│ - state: BookingState                                │
│─────────────────────────────────────────────────────│
│ + constructor(currentStatus)  → _resolve(status)     │
│ + setState(newState)                                 │
│ + toActive()   → delegates to this.state.toActive()  │
│ + toComplete() → delegates to this.state.toComplete()│
│ + toFailed()   → delegates to this.state.toFailed()  │
│─────────────────────────────────────────────────────│
│  Client: new BookingStateMachine(booking.status)     │
│          .toActive()   // throws 409 if not DRAFT    │
│  Zero if/switch logic — all delegated to state.      │
└─────────────────────────────────────────────────────┘
```

### Strategy Pattern — Pricing + Payment Gateway
```
┌─────────────────────────────────────────────────────┐
│  <<interface>> IPricingStrategy                      │
│  (strategies/pricing/IPricingStrategy.js)            │
│─────────────────────────────────────────────────────│
│ + calculatePrice(option, startTime, endTime): number │
└──────────────────────┬──────────────────────────────┘
                       │ extends
          ┌────────────┴─────────────────┐
          ▼                              ▼
┌──────────────────────┐   ┌───────────────────────────┐
│PerMinutePricingStrat.│   │PeakHourPricingStrategy    │
│(strategies/pricing/) │   │(strategies/pricing/)      │
│──────────────────────│   │───────────────────────────│
│basePrice × minutes   │   │1.5× surcharge 07–09, 17–19│
└──────────────────────┘   └───────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  PricingContext  (services/PricingService.js)        │
│          <<Singleton — exported as instance>>        │
│─────────────────────────────────────────────────────│
│ - strategy: IPricingStrategy                         │
│─────────────────────────────────────────────────────│
│ + setStrategy(strategy)                              │
│ + calculatePrice(option, start, end): number         │
│─────────────────────────────────────────────────────│
│  Default: PerMinutePricingStrategy                   │
│  Client: MobilityService.calculatePrice(...)         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│   <<interface>> IPaymentGateway                      │
│   (gateways/payment/IPaymentGateway.js)              │
│─────────────────────────────────────────────────────│
│ + charge(amount, metadata): Promise<{success,...}>   │
│ + refund(transactionId): Promise<{success,...}>      │
└──────────────────────┬──────────────────────────────┘
                       │ extends
          ┌────────────▼────────────┐
          │   MockPaymentGateway    │
          │  (payment/MockPayment   │
          │   Gateway.js)           │
          │─────────────────────────│
          │ token==="fail" → failure│
          │ else           → success│
          └─────────────────────────┘
Context: MobilityService calls paymentGateway.charge()
         against the IPaymentGateway interface only.
```

### Command Pattern — CommandRegistry + MobilityRequestHandler
```
┌─────────────────────────────────────────────────────┐
│  <<interface>> ICommand  (commands/ICommand.js)      │
│─────────────────────────────────────────────────────│
│ + execute(request: MobilityRequest)                  │
│       : Promise<MobilityResponse>                    │
└──────────────────────┬──────────────────────────────┘
                       │ extends (19 concrete commands)
          ┌────────────┼──────────────┬────────────────┐
          ▼            ▼              ▼                ▼
┌─────────────────┐ ┌─────────────┐ ┌──────────────┐ ...
│CreateBooking    │ │ConfirmBooking│ │GetVehicles   │
│DraftCommand     │ │Command      │ │Command       │
│─────────────────│ │─────────────│ │──────────────│
│receiver:        │ │receiver:    │ │receiver:     │
│MobilityService  │ │MobilityServ.│ │MobilityServ. │
│─────────────────│ │─────────────│ │──────────────│
│execute(request) │ │execute(req) │ │execute(req)  │
│→ createReserv() │ │→ processPay.│ │→ getVehicles │
└─────────────────┘ └─────────────┘ └──────────────┘

┌─────────────────────────────────────────────────────┐
│  CommandRegistry  (commands/CommandRegistry.js)      │
│─────────────────────────────────────────────────────│
│  Map<string, ICommand>:                              │
│    'GET_VEHICLES'         → GetVehiclesCommand       │
│    'CREATE_BOOKING_DRAFT' → CreateBookingDraftCommand│
│    'CONFIRM_BOOKING'      → ConfirmBookingCommand    │
│    'COMPLETE_BOOKING'     → CompleteBookingCommand   │
│    'GET_MY_BOOKINGS'      → GetMyBookingsCommand     │
│    ... 14 more entries (19 total)                    │
│─────────────────────────────────────────────────────│
│  MobilityService injected into every command at init │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  MobilityRequestHandler  (mvc/MobilityRequestHandler)│
│          <<Invoker — Singleton>>                     │
│─────────────────────────────────────────────────────│
│ + handle(request: MobilityRequest)                   │
│       : Promise<MobilityResponse>                    │
│─────────────────────────────────────────────────────│
│  registry.get(request.type) → command.execute(req)   │
│  No knowledge of MobilityService or any operation.   │
│  New request type = one registry entry; no changes here│
└─────────────────────────────────────────────────────┘
```

### Visitor Pattern — Analytics Events + Visitors
```
┌─────────────────────────────────────────────────────┐
│  <<abstract>> AnalyticsEvent                         │
│  (analytics/events/AnalyticsEvent.js)                │
│─────────────────────────────────────────────────────│
│ + get type(): string      (abstract)                 │
│ + get city(): string      (default: null)            │
│ + get metadata(): object  (default: {})              │
│ + accept(visitor)         (abstract)                 │
└──────────────────────┬──────────────────────────────┘
                       │ extends (8 concrete events)
    ┌──────────────────┼──────────────────────────┐
    ▼                  ▼                          ▼
┌──────────────────┐ ┌────────────────────┐     ...
│ReservationCreated│ │BookingConfirmedEvent│
│Event             │ │────────────────────│
│──────────────────│ │city, bookingId,    │
│city, vehicleType,│ │type, amount        │
│optionId, userId  │ │────────────────────│
│──────────────────│ │accept(v)→v.visit(this)│
│accept(v)→v.visit │ └────────────────────┘
│(this)            │
└──────────────────┘
(Also: PaymentProcessedEvent, VehicleReturnedEvent,
 ParkingReservedEvent, ParkingReleasedEvent,
 TransitQueryEvent, GatewayCallEvent)

┌─────────────────────────────────────────────────────┐
│  <<interface>> IAnalyticsVisitor                     │
│  (analytics/visitors/IAnalyticsVisitor.js)           │
│─────────────────────────────────────────────────────│
│ + visit(event: AnalyticsEvent)                       │
└──────────────────────┬──────────────────────────────┘
                       │ extends
          ┌────────────┴────────────┐
          ▼                        ▼
┌──────────────────────┐  ┌──────────────────────┐
│PersistenceVisitor    │  │LoggingVisitor        │
│(visitors/Persistence │  │(visitors/LoggingVisi │
│ Visitor.js)          │  │ tor.js)              │
│──────────────────────│  │──────────────────────│
│visit(event)          │  │visit(event)          │
│→ AnalyticsReport     │  │→ console.log(...)    │
│  .trackEvent(...)    │  │  event.type, city,   │
│  .catch(() => {})    │  │  metadata            │
└──────────────────────┘  └──────────────────────┘

Client: AnalyticsListener
  EventBus.on('RESERVATION_CREATED', (event) => {
    event.accept(persistenceVisitor);
    event.accept(loggingVisitor);
  });
Double dispatch: event.accept(v) → v.visit(this)
  — 1st dispatch selects accept() on the concrete event
  — 2nd dispatch routes to visitor.visit(event)
```

### Factory Method Pattern — Gateway Factory
```
┌─────────────────────────────────────────────────────┐
│      GatewayFactory  (gateways/index.js)             │
│─────────────────────────────────────────────────────│
│  GATEWAY_MAP: { payment, transit, parking,           │
│                 maps, weather } → factory functions  │
│─────────────────────────────────────────────────────│
│ + createGateway(type)                                │
│ + createPaymentGateway() → IPaymentGateway           │
│ + createTransitGateway() → ITransitGateway           │
│ + createParkingGateway() → IParkingGateway           │
│ + createMapsGateway()    → IMapsGateway              │
│ + createWeatherGateway() → IWeatherGateway           │
│─────────────────────────────────────────────────────│
│  Swap mock → real: one line in GATEWAY_MAP.          │
│  MobilityService never calls new ConcreteGateway()   │
└─────────────────────────────────────────────────────┘
```

---

## Key Relationships

```
CommuterWebView / ProviderDashboardView / AdminDashboardView  ──HTTP──▶  Routes
Routes                                ──calls──▶  MobilityController
MobilityController                    ──creates─▶  MobilityRequest
MobilityController                    ──calls──▶  MobilityRequestHandler
MobilityRequestHandler                ──calls──▶  MobilityService
MobilityService                       ──calls──▶  MobilityDataGateway
MobilityDataGateway                   ──calls──▶  MobilityDataMapper
MobilityDataGateway                   ──reads/writes─▶  SUMMSDatabase
MobilityRequestHandler                ──returns─▶  MobilityResponse
MobilityController                    ──calls──▶  MobilityPresenter
MobilityPresenter                     ──formats─▶  ViewModel
ViewModel                             ──rendered by─▶  View

// Design patterns within the Model:
MobilityService                       ──uses──▶  BookingStateMachine (State — context)
BookingStateMachine                   ──delegates─▶  DraftState / ActiveState / CompleteState / FailedState
MobilityService                       ──emits──▶  EventBus (Observer — publisher)
EventBus                              ──notifies─▶  AnalyticsListener (Observer — subscriber)
AnalyticsListener                     ──calls──▶  event.accept(visitor) (Visitor)
AnalyticsListener                     ──persists─▶  SUMMSDatabase
MobilityService                       ──calls──▶  IPricingStrategy (Strategy — pricing)
MobilityService                       ──calls──▶  IPaymentGateway (Strategy — payment)
GatewayFactory                        ──creates─▶  IPaymentGateway / ITransitGateway (Factory Method)
MobilityDataGateway                   ──adapts──▶  Firestore models (Adapter)
MobilityDataMapper                    ──translates─▶  MobilityEntities (Adapter)
MobilityController                    ──calls──▶  MobilityRequestHandler (Command — Invoker)
MobilityRequestHandler                ──looks up─▶  CommandRegistry (Command — registry)
CommandRegistry                       ──dispatches─▶  ConcreteCommand.execute() (Command)
ConcreteCommand                       ──calls──▶  MobilityService (Command — Receiver)
```

---

## Enumerations

```
UserRole:       COMMUTER | MOBILITY_PROVIDER | CITY_ADMINISTRATOR | SYSTEM_ADMINISTRATOR
VehicleStatus:  AVAILABLE | RESERVED | IN_USE | OUT_OF_SERVICE
BookingStatus:  DRAFT | ACTIVE | COMPLETE | FAILED
TripMode:       CAR_SHARING | BIKE_SHARING | SCOOTER_SHARING | BUS | METRO | TRAM
ParkingStatus:  AVAILABLE | RESERVED | OUT_OF_SERVICE
ReceiptStatus:  SUCCESS | FAILED
```
