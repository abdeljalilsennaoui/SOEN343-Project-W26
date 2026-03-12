# SUMMS — Class Diagram

> Reflects the actual backend codebase as of Sprint 3.
> Organized by architectural layer: Infrastructure → Domain → Gateway → Service → Controller.

---

## Layered Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│          React Frontend (AuthContext, Pages, Navbar)         │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTP / Firebase Auth
┌─────────────────────────────────────────────────────────────┐
│                   CONTROLLER LAYER (Express)                 │
│  BookingController  ProviderController  TransitController    │
│  ParkingController  AnalyticsController  UserController      │
└─────────────────────────────────────────────────────────────┘
                              ↓ delegates to
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE / FACADE LAYER                   │
│  BookingFacade  BookingService  MobilitySearchService        │
│  ProviderService  TransitAdapter  ParkingAdapter             │
│  AvailabilityService  PricingService  AnalyticsListener      │
└─────────────────────────────────────────────────────────────┘
                              ↓ delegates to
┌─────────────────────────────────────────────────────────────┐
│                       DOMAIN MODEL LAYER                     │
│  User  Vehicle  Booking  MobilityOption  PaymentReceipt      │
│  Parking  AnalyticsReport  ApiError  enums                   │
└─────────────────────────────────────────────────────────────┘
                              ↓ persists to
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                      │
│  Firestore  Firebase Admin  EventBus  BookingStateMachine    │
│  GatewayFactory  IPaymentGateway  ITransitGateway  IParkingGateway │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer 1 — Infrastructure / Lib

```
┌───────────────────────────────┐
│         <<singleton>>         │
│           EventBus            │
│  (lib/EventBus.js)            │
│───────────────────────────────│
│ + on(event: string,           │
│      handler: Function): void │
│ + emit(event: string,         │
│        payload: object): void │
└───────────────────────────────┘

┌───────────────────────────────────────┐
│           <<singleton>>               │
│        BookingStateMachine            │
│  (lib/BookingStateMachine.js)         │
│───────────────────────────────────────│
│ - TRANSITIONS: Map<BookingStatus,     │
│                BookingStatus[]>       │
│───────────────────────────────────────│
│ + transition(booking: object,         │
│              toStatus: BookingStatus) │
│              : BookingStatus          │
│ + canTransition(from: BookingStatus,  │
│                 to: BookingStatus)    │
│                 : boolean             │
└───────────────────────────────────────┘
```

---

## Layer 2 — Domain Model (Firestore-backed modules)

> Each file is a module of async functions mapped to one Firestore collection.
> There is no class inheritance in this layer — domain objects are plain data documents.

```
┌──────────────────────────────┐      ┌──────────────────────────────┐
│        <<entity>>            │      │        <<entity>>            │
│           User               │      │          Vehicle             │
│  (models/User.js)            │      │  (models/Vehicle.js)         │
│──────────────────────────────│      │──────────────────────────────│
│ uid: string                  │      │ id: string                   │
│ email: string                │      │ city: string                 │
│ displayName: string          │      │ type: TripMode               │
│ role: UserRole               │      │ pricePerMin: number          │
│ createdAt: Timestamp         │      │ providerId: string           │
│──────────────────────────────│      │ status: VehicleStatus        │
│ + findByUid(uid)             │      │ description: string          │
│ + upsert(uid, data)          │      │──────────────────────────────│
│ + buildNewUser(uid, email,   │      │ + findAll(filters)           │
│     displayName, role)       │      │ + findById(id)               │
└──────────────────────────────┘      │ + create(data)               │
                                      │ + update(id, fields)         │
                                      │ + deactivate(id)             │
                                      │ + reserveVehicle(id)         │
                                      │ + releaseVehicle(id)         │
                                      └──────────────────────────────┘

┌──────────────────────────────┐      ┌──────────────────────────────┐
│        <<entity>>            │      │        <<entity>>            │
│          Booking             │      │      MobilityOption          │
│  (models/Booking.js)         │      │  (models/MobilityOption.js)  │
│──────────────────────────────│      │──────────────────────────────│
│ id: string                   │      │ id: string                   │
│ userId: string               │      │ city: string                 │
│ optionId: string             │      │ type: TripMode               │
│ startTime: string (ISO)      │      │ basePrice: number            │
│ endTime: string (ISO)        │      │ description: string          │
│ pickupLocation: object|string│      │ blockedPeriods: Period[]     │
│ totalPrice: number           │      │──────────────────────────────│
│ status: BookingStatus        │      │ + findById(id)               │
│ createdAt: string            │      │ + findAll({city, type})      │
│ updatedAt: string            │      └──────────────────────────────┘
│──────────────────────────────│
│ + create(data)               │      ┌──────────────────────────────┐
│ + findById(id)               │      │        <<entity>>            │
│ + findByUserId(userId)       │      │      PaymentReceipt          │
│ + findAll()                  │      │  (models/PaymentReceipt.js)  │
│ + update(id, updates)        │      │──────────────────────────────│
└──────────────────────────────┘      │ id: string                   │
                                      │ bookingId: string            │
┌──────────────────────────────┐      │ amount: number               │
│        <<entity>>            │      │ providerRef: string          │
│   ParkingFacility / Spot     │      │ status: ReceiptStatus        │
│  (models/Parking.js)         │      │ timestamp: string            │
│──────────────────────────────│      │──────────────────────────────│
│ id: string                   │      │ + create(data)               │
│ city: string                 │      │ + findByBookingId(id)        │
│ name: string                 │      └──────────────────────────────┘
│ facilityId: string (spot)    │
│ status: ParkingStatus        │      ┌──────────────────────────────┐
│──────────────────────────────│      │     <<value object>>         │
│ + findAllFacilities(city)    │      │         ApiError             │
│ + findFacilityById(id)       │      │  extends Error               │
│ + findSpotsByFacility(id)    │      │──────────────────────────────│
│ + getAvailableSpots(city)    │      │ code: string                 │
│ + reserveSpot(spotId)        │      │ statusCode: number           │
│ + releaseSpot(spotId)        │      │──────────────────────────────│
└──────────────────────────────┘      │ + notFound(msg)       → 404  │
                                      │ + forbidden(msg)      → 403  │
                                      │ + conflict(msg)       → 409  │
                                      │ + unauthorized(msg)   → 401  │
                                      │ + paymentFailed(msg)  → 402  │
                                      └──────────────────────────────┘
```

---

## Layer 3 — Gateway Interfaces + Implementations

```
┌─────────────────────────────┐      ┌─────────────────────────────┐
│       <<interface>>         │      │       <<interface>>         │
│      IPaymentGateway        │      │      ITransitGateway        │
│  (gateways/payment/)        │      │  (gateways/transit/)        │
│─────────────────────────────│      │─────────────────────────────│
│ + charge(amount, metadata)  │      │ + getSchedule(city, line)   │
│ + refund(transactionId)     │      │ + getNearbyStops(lat, lng)  │
└──────────────┬──────────────┘      └──────────────┬──────────────┘
               │ extends                             │ extends
┌──────────────▼──────────────┐      ┌──────────────▼──────────────┐
│    MockPaymentGateway       │      │    MockTransitGateway       │
│─────────────────────────────│      │─────────────────────────────│
│ token="fail" → failure      │      │ returns hardcoded schedule  │
│ else → success + txId       │      │ and nearby stop data        │
└─────────────────────────────┘      └─────────────────────────────┘

┌─────────────────────────────┐      ┌─────────────────────────────┐
│       <<interface>>         │      │       <<factory>>           │
│      IParkingGateway        │      │      GatewayFactory         │
│  (gateways/parking/)        │      │  (gateways/index.js)        │
│─────────────────────────────│      │─────────────────────────────│
│ + getAvailableSpots(city)   │      │ - GATEWAY_MAP: Map          │
│ + reserveSpot(spotId)       │      │─────────────────────────────│
└──────────────┬──────────────┘      │ + createGateway(type)       │
               │ extends             │ + createPaymentGateway()    │
┌──────────────▼──────────────┐      │ + createTransitGateway()   │
│    MockParkingGateway       │      │ + createParkingGateway()    │
└─────────────────────────────┘      └─────────────────────────────┘
```

---

## Layer 4 — Service Layer

```
┌────────────────────────────────────┐
│         AvailabilityService        │
│  (services/AvailabilityService.js) │
│────────────────────────────────────│
│ + isAvailable(option, startTime,   │
│     endTime, excludeBookingId?)    │
│     : Promise<boolean>             │
│   reads: Booking.findAll()         │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│           PricingService           │
│  (services/PricingService.js)      │
│────────────────────────────────────│
│ + calculatePrice(option,           │
│     startTime, endTime): number    │
│   formula: basePrice × durationMin │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│       MobilitySearchService        │
│  (services/MobilitySearchService)  │
│────────────────────────────────────│
│ + search({city, type, maxPrice,    │
│     startTime, endTime})           │
│     : Promise<OptionViewModel[]>   │
│   uses: AvailabilityService        │
│   uses: PricingService             │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│          ProviderService           │
│  (services/ProviderService.js)     │
│────────────────────────────────────│
│ + addVehicle(providerId, data)     │
│ + updateVehicle(id, uid, fields)   │
│ + deactivateVehicle(id, uid)       │
│ + getProviderVehicles(providerId)  │
│   uses: Vehicle model              │
└────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       <<adapter>>  TransitAdapter       │
│  (services/TransitAdapter.js)           │
│─────────────────────────────────────────│
│ - gateway: ITransitGateway              │
│─────────────────────────────────────────│
│ + getSchedule(city, line?)              │
│ + getNearbyStops(lat, lng)              │
│   emits: TRANSIT_QUERY, GATEWAY_CALL   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       <<adapter>>  ParkingAdapter       │
│  (services/ParkingAdapter.js)           │
│─────────────────────────────────────────│
│ - gateway: IParkingGateway              │
│─────────────────────────────────────────│
│ + getAvailableSpots(city)               │
│ + reserveSpot(spotId)                   │
│   emits: GATEWAY_CALL                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              BookingService                  │
│  (services/BookingService.js)               │
│─────────────────────────────────────────────│
│ - paymentGateway: IPaymentGateway           │
│─────────────────────────────────────────────│
│ + createDraft({userId, optionId,            │
│     startTime, endTime, pickupLocation})    │
│ + confirmDraft(draftId, userId, payment)    │
│ + completeBooking(bookingId, userId)        │
│ + getMyBookings(userId)                     │
│─────────────────────────────────────────────│
│   uses: BookingStateMachine                 │
│   uses: AvailabilityService                 │
│   uses: PricingService                      │
│   uses: IPaymentGateway (Strategy)          │
│   emits: RESERVATION_CREATED               │
│   emits: BOOKING_CONFIRMED                  │
│   emits: PAYMENT_PROCESSED                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           <<facade>> BookingFacade          │
│  (services/BookingFacade.js)                │
│─────────────────────────────────────────────│
│ + searchOptions(params)                     │
│ + createDraft(...)                          │
│ + confirmDraft(...)                         │
│ + completeBooking(...)                      │
│ + getMyBookings(userId)                     │
│─────────────────────────────────────────────│
│   delegates to: BookingService              │
│   delegates to: MobilitySearchService       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│    <<observer>> AnalyticsListener           │
│  (services/AnalyticsListener.js)            │
│─────────────────────────────────────────────│
│ + register(): void                          │
│   subscribes via EventBus.on(...)           │
│   handles: RESERVATION_CREATED             │
│            BOOKING_CONFIRMED                │
│            VEHICLE_RETURNED                 │
│            PAYMENT_PROCESSED                │
│            PARKING_RESERVED                 │
│            PARKING_RELEASED                 │
│            TRANSIT_QUERY                    │
│            GATEWAY_CALL                     │
│   calls: AnalyticsReport.trackEvent()       │
└─────────────────────────────────────────────┘
```

---

## Layer 5 — Controllers (GRASP Controllers)

> Each is a class exported as a singleton. Responsibilities: parse HTTP request,
> call one facade/service, return response. No business logic, no model imports.

```
┌───────────────────────────────────┐
│   <<GRASP Controller>>            │
│      BookingController            │
│  (controllers/BookingController)  │
│───────────────────────────────────│
│ + createDraft(req, res, next)     │
│ + confirmDraft(req, res, next)    │
│ + completeBooking(req, res, next) │
│ + getMyBookings(req, res, next)   │
│   uses: BookingFacade             │
└───────────────────────────────────┘

┌───────────────────────────────────┐   ┌───────────────────────────────────┐
│   <<GRASP Controller>>            │   │   <<GRASP Controller>>            │
│     ProviderController            │   │      TransitController            │
│───────────────────────────────────│   │───────────────────────────────────│
│ + getVehicles(req, res, next)     │   │ + getSchedule(req, res, next)     │
│ + addVehicle(req, res, next)      │   │ + getNearbyStops(req, res, next)  │
│ + updateVehicle(req, res, next)   │   │   uses: TransitAdapter            │
│ + deactivateVehicle(...)          │   └───────────────────────────────────┘
│   uses: ProviderService           │
└───────────────────────────────────┘   ┌───────────────────────────────────┐
                                        │   <<GRASP Controller>>            │
┌───────────────────────────────────┐   │     AnalyticsController           │
│   <<GRASP Controller>>            │   │───────────────────────────────────│
│      ParkingController            │   │ + getRentalAnalytics(...)         │
│───────────────────────────────────│   │ + getGatewayAnalytics(...)        │
│ + getFacilities(req, res, next)   │   │   uses: AnalyticsReport           │
│ + getAvailableSpots(...)          │   └───────────────────────────────────┘
│ + reserveSpot(req, res, next)     │
│ + releaseSpot(req, res, next)     │   ┌───────────────────────────────────┐
│   uses: Parking model             │   │   <<GRASP Controller>>            │
│   emits: PARKING_RESERVED         │   │       UserController              │
│   emits: PARKING_RELEASED         │   │───────────────────────────────────│
└───────────────────────────────────┘   │ + register(req, res, next)        │
                                        │ + getMe(req, res, next)           │
                                        │   uses: User model, Firebase Admin│
                                        └───────────────────────────────────┘
```

---

## Key Relationships

```
BookingController   ──uses──▶  BookingFacade
BookingFacade       ──uses──▶  BookingService
BookingFacade       ──uses──▶  MobilitySearchService
BookingService      ──uses──▶  BookingStateMachine
BookingService      ──uses──▶  AvailabilityService
BookingService      ──uses──▶  PricingService
BookingService      ──uses──▶  IPaymentGateway          (Strategy)
BookingService      ──emits──▶ EventBus
ProviderController  ──uses──▶  ProviderService
ProviderService     ──uses──▶  Vehicle
TransitController   ──uses──▶  TransitAdapter
TransitAdapter      ──wraps──▶ ITransitGateway           (Adapter)
ParkingAdapter      ──wraps──▶ IParkingGateway           (Adapter)
GatewayFactory      ──creates▶ MockPaymentGateway        (Factory Method)
GatewayFactory      ──creates▶ MockTransitGateway
GatewayFactory      ──creates▶ MockParkingGateway
MockPaymentGateway  ──extends▶ IPaymentGateway
MockTransitGateway  ──extends▶ ITransitGateway
MockParkingGateway  ──extends▶ IParkingGateway
EventBus            ──notifies▶ AnalyticsListener        (Observer)
AnalyticsListener   ──calls──▶ AnalyticsReport
```

---

## Enumerations (shared across all layers)

```
UserRole:       COMMUTER | MOBILITY_PROVIDER | CITY_ADMINISTRATOR | SYSTEM_ADMINISTRATOR
VehicleStatus:  AVAILABLE | RESERVED | IN_USE | OUT_OF_SERVICE
BookingStatus:  DRAFT | ACTIVE | COMPLETE | FAILED
TripMode:       CAR_SHARING | BIKE_SHARING | SCOOTER_SHARING | BUS | METRO | TRAM
ParkingStatus:  AVAILABLE | RESERVED | OUT_OF_SERVICE
ReceiptStatus:  SUCCESS | FAILED
PaymentStatus:  PENDING | CONFIRMED | FAILED | REFUNDED
ReservationStatus: PENDING | ACTIVE | COMPLETED | CANCELLED
```
