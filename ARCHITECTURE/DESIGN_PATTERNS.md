# SUMMS — Design Patterns

> Eight GoF patterns applied in the SUMMS MVC backend.
> Every pattern is located entirely in the **Model** layer unless noted.

---

## MVC Request Flow

```
View (React)
  → MobilityController           [Controller]
  → MobilityRequest (DTO)
  → MobilityRequestHandler       [Invoker — Command pattern]
  → ConcreteCommand.execute()    [Command pattern]
  → MobilityService              [Receiver — all business logic]
  → MobilityDataGateway          [Adapter pattern]
  → MobilityDataMapper
  → Firestore
  → MobilityResponse (DTO)
  → MobilityPresenter            [Controller]
  → View
```

---

## Pattern Index

| # | Pattern | Category | Files | Problem solved |
|---|---|---|---|---|
| 1 | Singleton | Creational | `lib/EventBus.js`, `mvc/MobilityController.js`, `mvc/MobilityService.js`, `mvc/MobilityRequestHandler.js`, `mvc/MobilityPresenter.js`, `mvc/MobilityDataGateway.js` | Shared single instances across the app (DTOs and Mapper are not singletons) |
| 2 | Observer | Behavioural | `lib/EventBus.js`, `services/AnalyticsListener.js` | Decouple analytics tracking from business logic |
| 3 | Factory Method | Creational | `gateways/index.js` | Centralise and swap gateway implementations |
| 4 | Adapter | Structural | `mvc/MobilityDataGateway.js`, `mvc/MobilityDataMapper.js` | Shield service layer from Firestore document format |
| 5 | State | Behavioural | `lib/states/BookingState.js`, `lib/BookingStateMachine.js` | Enforce booking lifecycle transitions in one place |
| 6 | Strategy | Behavioural | `strategies/pricing/`, `services/PricingService.js` | Interchangeable pricing algorithms with runtime switching |
| 7 | Command | Behavioural | `commands/`, `mvc/MobilityRequestHandler.js` | Encapsulate each request as an object; remove switch statement |
| 8 | Visitor | Behavioural | `analytics/events/` (9 events), `analytics/visitors/` | Add new analytics operations without modifying event classes |

---

## 1. Singleton

> Ensure a class has exactly one instance and provide a global point of access to it.

**Roles in SUMMS**

| Class | Why exactly one instance |
|---|---|
| `lib/EventBus.js` | Shared pub/sub channel — multiple instances would silently break Observer |
| `mvc/MobilityController.js` | Stateless HTTP coordinator — no reason to duplicate |
| `mvc/MobilityService.js` | Stateless business logic — shared safely |
| `mvc/MobilityRequestHandler.js` | Stateless invoker |
| `mvc/MobilityPresenter.js` | Stateless formatter |
| `mvc/MobilityDataGateway.js` | Stateless data accessor |

**Not singletons** (also in `mvc/` but intentionally exported differently)

| Class | Export style | Why |
|---|---|---|
| `mvc/MobilityRequest.js` | `module.exports = MobilityRequest` (class) | DTO — a new instance is created per incoming request |
| `mvc/MobilityResponse.js` | `module.exports = MobilityResponse` (class) | DTO — a new instance is created per outgoing response (via static factories `ok()`, `fail()`) |
| `mvc/MobilityDataMapper.js` | `module.exports = MobilityDataMapper` (class) | All methods are static — no instance needed |

**How it works**

Node's module cache is the mechanism — `module.exports = new ClassName()` guarantees one instance per process. No `getInstance()` method is needed.

```js
// Singleton mvc/ classes (stateless coordinators)
class MobilityService { ... }
module.exports = new MobilityService();   // singleton via module cache

// Non-singleton mvc/ classes (DTOs, static utilities)
class MobilityRequest { ... }
module.exports = MobilityRequest;          // callers instantiate per use
```

**SOLID / GRASP**
- Applied only where a genuinely shared resource exists, not as a default.
- `EventBus` as a singleton is required for **Observer** to function correctly.

---

## 2. Observer

> Define a one-to-many dependency so that when one object changes state, all dependents are notified automatically.

**Roles in SUMMS**

| Role | Class |
|---|---|
| Subject (event bus) | `lib/EventBus.js` |
| Publisher | `mvc/MobilityService.js` |
| Concrete Observer | `services/AnalyticsListener.js` |
| Data sink | `models/AnalyticsReport.js` |

**How it works**

`MobilityService` emits typed domain events onto `EventBus` after each significant operation. `AnalyticsListener` subscribes to those events and persists them to Firestore. Neither side imports the other — they share only an event name string.

Events emitted by `MobilityService`: `RESERVATION_CREATED`, `BOOKING_CONFIRMED`, `PAYMENT_PROCESSED`, `VEHICLE_RETURNED`, `PARKING_RESERVED`, `PARKING_RELEASED`, `TRANSIT_QUERY`, `GATEWAY_CALL`, `RIDE_JOINED`.

| Event | Emitted when | Key metadata |
|---|---|---|
| `RESERVATION_CREATED` | Draft booking saved | city, vehicleType, optionId, userId |
| `BOOKING_CONFIRMED` | Payment succeeds, booking → ACTIVE | city, bookingId, type, amount |
| `PAYMENT_PROCESSED` | Payment gateway responds (success) | city, bookingId, amount |
| `VEHICLE_RETURNED` | Booking → COMPLETE | city, bookingId |
| `PARKING_RESERVED` | Spot reserved | city, spotId |
| `PARKING_RELEASED` | Spot released | city, spotId |
| `TRANSIT_QUERY` | Transit schedule/stops queried | city, line |
| `GATEWAY_CALL` | Any external gateway called | service, operation, success |
| `RIDE_JOINED` | Passenger joins a shared ride | bookingId, passengerId |

```js
// Publisher (MobilityService)
EventBus.emit('RESERVATION_CREATED', new ReservationCreatedEvent({ ... }));

// Subscriber (AnalyticsListener)
EventBus.on('RESERVATION_CREATED', (event) => {
  event.accept(persistenceVisitor);   // Visitor pattern applied here
});
```

Analytics failures are fire-and-forget (`.catch(() => {})`) — they never block a booking response.

**SOLID / GRASP**
- **Low Coupling**: publishers and subscribers share only an event name string — no imports between them.
- **Open/Closed**: add a new subscriber by calling `EventBus.on(...)` — no existing code changes.
- **MVC alignment**: the Model notifies observers of state changes with no dependency on View or Controller.

---

## 3. Factory Method

> Define an interface for creating objects, but let subclasses (or a registry) decide which class to instantiate.

**Roles in SUMMS**

| Role | Class |
|---|---|
| Factory | `gateways/index.js` — `createPaymentGateway()`, `createTransitGateway()`, etc. |
| Product interface | `IPaymentGateway`, `ITransitGateway`, `IParkingGateway` |
| Concrete products | `MockPaymentGateway`, `MockTransitGateway`, `MockParkingGateway` |
| Client | `mvc/MobilityService.js` |

**How it works**

`gateways/index.js` maintains a `GATEWAY_MAP` lookup table. `MobilityService` calls `createPaymentGateway()` and receives an object that satisfies `IPaymentGateway` — it never references a concrete class. Swapping mock for real (e.g. Stripe) is one line in `GATEWAY_MAP`.

```js
// gateways/index.js
const GATEWAY_MAP = {
  payment: MockPaymentGateway,
  transit: MockTransitGateway,
};
function createPaymentGateway() { return new GATEWAY_MAP.payment(); }

// MobilityService — only knows the interface
const paymentGateway = createPaymentGateway();
await paymentGateway.charge(amount, details);
```

**SOLID / GRASP**
- **Protected Variation**: factory is the single variation point for all external service creation.
- **Dependency Inversion**: `MobilityService` depends on gateway abstractions, not concrete classes.
- **Open/Closed**: new gateway implementation = add entry to `GATEWAY_MAP`, no other changes.

---

## 4. Adapter

> Convert the interface of a class into another interface clients expect. Lets classes work together that couldn't otherwise because of incompatible interfaces.

**Roles in SUMMS**

| Role | Class |
|---|---|
| Adapter | `mvc/MobilityDataGateway.js` |
| Shape translator | `mvc/MobilityDataMapper.js` |
| Adaptee | Firestore model modules (`Booking.js`, `Vehicle.js`, etc.) |
| Client | `mvc/MobilityService.js` |

**How it works**

`MobilityService` calls clean domain-level methods (`findBooking(id)`, `saveBooking(data)`). `MobilityDataGateway` translates these into Firestore model calls. `MobilityDataMapper` converts raw Firestore documents into typed domain entities. The service never sees a Firestore field name.

```
MobilityService.createReservation()
  → MobilityDataGateway.saveBooking(data)        [adapter — uniform interface]
      → Booking.create(firestoreDoc)              [adaptee — raw Firestore]
      → MobilityDataMapper.toBooking(doc)         [shape translator]
  ← returns domain Booking entity
```

**SOLID / GRASP**
- **Protected Variation**: `MobilityDataGateway` is the protected variation point for all database access — replace Firestore by rewriting only gateway + mapper.
- **Low Coupling**: `MobilityService` imports zero Firestore model modules.
- **Indirection**: gateway and mapper are intermediaries preventing direct coupling between business logic and persistence.

---

## 5. State

> Allow an object to alter its behaviour when its internal state changes. The object will appear to change its class.

**Roles in SUMMS**

| Role | Class |
|---|---|
| State interface | `lib/states/BookingState.js` |
| Concrete state: DRAFT | `lib/states/DraftState.js` |
| Concrete state: ACTIVE | `lib/states/ActiveState.js` |
| Concrete state: COMPLETE | `lib/states/CompleteState.js` (terminal) |
| Concrete state: FAILED | `lib/states/FailedState.js` (terminal) |
| Context | `lib/BookingStateMachine.js` |
| Client | `mvc/MobilityService.js` |

**How it works**

`BookingStateMachine` is the Context: it holds `this.state` (a `BookingState` object) and delegates every action to it via `toActive()`, `toComplete()`, and `toFailed()`. Each concrete state class overrides only the transitions it permits. Terminal states (`CompleteState`, `FailedState`) override nothing — all actions fall through to the default 409 throw in `BookingState`.

`MobilityService` creates a fresh context from the booking's current DB status before each transition attempt. If the transition is illegal, the state throws a 409 before any Firestore write or payment charge occurs.

```js
// BookingState.js — state interface (default: all actions throw 409)
class BookingState {
  getName()          { throw new Error('must implement'); }
  toActive(context)  { throw new ApiError('DRAFT_INVALID_STATE', `Cannot activate from ${this.getName()}`, 409); }
  toComplete(context){ throw new ApiError('DRAFT_INVALID_STATE', `Cannot complete from ${this.getName()}`, 409); }
  toFailed(context)  { throw new ApiError('DRAFT_INVALID_STATE', `Cannot fail from ${this.getName()}`, 409); }
}

// DraftState.js — concrete state: allows toActive and toFailed
class DraftState extends BookingState {
  getName() { return 'DRAFT'; }
  toActive(context)  { context.setState(new ActiveState()); }   // DRAFT → ACTIVE ✓
  toFailed(context)  { context.setState(new FailedState()); }   // DRAFT → FAILED ✓
  // toComplete not overridden → throws 409
}

// ActiveState.js — concrete state: allows only toComplete
class ActiveState extends BookingState {
  getName() { return 'ACTIVE'; }
  toComplete(context) { context.setState(new CompleteState()); } // ACTIVE → COMPLETE ✓
  // toActive, toFailed not overridden → throw 409
}

// CompleteState.js — terminal: no transitions permitted
class CompleteState extends BookingState { getName() { return 'COMPLETE'; } }

// FailedState.js — terminal: no transitions permitted
class FailedState extends BookingState { getName() { return 'FAILED'; } }

// BookingStateMachine.js — context: holds state, delegates actions
class BookingStateMachine {
  constructor(currentStatus) {
    this.state = BookingStateMachine._resolve(currentStatus); // DraftState / ActiveState / ...
  }
  setState(newState) { this.state = newState; }
  toActive()   { this.state.toActive(this); }   // delegates to current state
  toComplete() { this.state.toComplete(this); }
  toFailed()   { this.state.toFailed(this); }
}

// MobilityService.js — client: one context per transition attempt
new BookingStateMachine(booking.status).toActive();    // throws 409 if not DRAFT
new BookingStateMachine(booking.status).toFailed();    // throws 409 if not DRAFT
new BookingStateMachine(booking.status).toComplete();  // throws 409 if not ACTIVE
```

**SOLID / GRASP**
- **Open/Closed**: adding a `CANCELLED` state = one new `CancelledState` class + one entry in `_resolve()`. No existing state class changes.
- **Pure Fabrication / High Cohesion**: `BookingStateMachine` is invented solely to manage transitions — all rules are encapsulated in state classes, none leak into `MobilityService`.
- **No conditionals in the context**: `BookingStateMachine` has zero `if/switch` logic — it only delegates.

---

## 6. Strategy

> Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from clients that use it.

**Roles in SUMMS**

| Role | Class |
|---|---|
| Strategy interface | `strategies/pricing/IPricingStrategy.js` |
| Concrete strategy A | `strategies/pricing/PerMinutePricingStrategy.js` |
| Concrete strategy B | `strategies/pricing/PeakHourPricingStrategy.js` |
| Context | `services/PricingService.js` (`PricingContext` class) |
| Client | `mvc/MobilityService.js` |

**How it works**

`PricingContext` stores a strategy reference and exposes `setStrategy()` for runtime switching. All price calculation is delegated to the current strategy — the context contains no pricing logic itself. The default is `PerMinutePricingStrategy`; switching to peak-hour pricing requires one call.

```js
// IPricingStrategy — interface
class IPricingStrategy {
  calculatePrice(option, startTime, endTime) { throw new Error('must implement'); }
}

// PerMinutePricingStrategy — standard billing
class PerMinutePricingStrategy extends IPricingStrategy {
  calculatePrice(option, startTime, endTime) {
    const minutes = Math.max(1, (new Date(endTime) - new Date(startTime)) / 60000);
    return Math.round(option.basePrice * minutes * 100) / 100;
  }
}

// PeakHourPricingStrategy — 1.5× surcharge 07:00–09:00 and 17:00–19:00
class PeakHourPricingStrategy extends IPricingStrategy {
  calculatePrice(option, startTime, endTime) {
    const minutes = Math.max(1, (new Date(endTime) - new Date(startTime)) / 60000);
    const hour = new Date(startTime).getHours();
    const multiplier = (hour >= 7 && hour < 9) || (hour >= 17 && hour < 19) ? 1.5 : 1.0;
    return Math.round(option.basePrice * minutes * multiplier * 100) / 100;
  }
}

// PricingContext — context; delegates to strategy
class PricingContext {
  constructor(strategy) { this.strategy = strategy; }
  setStrategy(strategy) { this.strategy = strategy; }             // runtime switch
  calculatePrice(option, start, end) {
    return this.strategy.calculatePrice(option, start, end);      // delegates
  }
}
module.exports = new PricingContext(new PerMinutePricingStrategy());

// MobilityService — client; unaware of which algorithm is active
const totalPrice = PricingService.calculatePrice(option, startTime, endTime);

// Switch at runtime (e.g. during peak hours):
// PricingService.setStrategy(new PeakHourPricingStrategy());
```

**SOLID / GRASP**
- **Protected Variation**: `IPricingStrategy` is the variation point — callers never see which algorithm runs.
- **Open/Closed**: new pricing model = one new class; `PricingContext` never changes.
- **Dependency Inversion**: `PricingContext` depends on the abstraction, not a concrete class.

---

## 7. Command

> Encapsulate a request as an object, thereby letting you parameterise clients with different requests, queue or log requests, and support undoable operations.

**Roles in SUMMS**

| Role | Class |
|---|---|
| Command interface | `commands/ICommand.js` |
| Concrete commands | `commands/booking.commands.js`, `vehicle.commands.js`, `provider.commands.js`, `parking.commands.js`, `transit.commands.js`, `analytics.commands.js` (22 command classes total) |
| Receiver | `mvc/MobilityService.js` — injected into every command via constructor |
| Registry | `commands/CommandRegistry.js` — maps request type string → command instance |
| Invoker | `mvc/MobilityRequestHandler.js` — looks up and calls `execute()` |

**How it works**

Each request type (e.g. `CREATE_BOOKING_DRAFT`) is a separate class. The command holds a reference to `MobilityService` (the Receiver) and calls one method on it inside `execute()`. `MobilityRequestHandler` (the Invoker) looks up the command in the registry and calls `execute(request)` — it never imports `MobilityService` or knows what any command does.

```js
// ICommand — interface
class ICommand {
  async execute(request) { throw new Error('must implement'); }
}

// CreateBookingDraftCommand — concrete command
class CreateBookingDraftCommand extends ICommand {
  constructor(receiver) {           // receiver = MobilityService
    super();
    this.receiver = receiver;
  }
  async execute(request) {
    const draft = await this.receiver.createReservation({
      userId: request.userId, ...request.payload
    });
    return MobilityResponse.created(draft);
  }
}

// CommandRegistry — maps type → command instance
const registry = new Map([
  ['CREATE_BOOKING_DRAFT', new CreateBookingDraftCommand(MobilityService)],
  ['CONFIRM_BOOKING',      new ConfirmBookingCommand(MobilityService)],
  // ... 20 more (including LIST_RIDE_SHARES, JOIN_RIDE, LEAVE_RIDE)
]);

// MobilityRequestHandler — invoker (replaces 19-case switch statement)
async handle(request) {
  const command = registry.get(request.type);
  if (!command) return MobilityResponse.fail(`Unknown request type: ${request.type}`, 400);
  return command.execute(request);
}
```

**SOLID / GRASP**
- **Open/Closed**: new request type = one new command class + one registry entry; the invoker never changes.
- **Single Responsibility**: each command class has exactly one responsibility.
- **Low Coupling**: `MobilityRequestHandler` imports only `ICommand` (via the registry); it has no knowledge of `MobilityService` or any operation.

---

## 8. Visitor

> Represent an operation to be performed on elements of an object structure. Visitor lets you define a new operation without changing the classes of the elements on which it operates.

**Roles in SUMMS**

| Role | Class |
|---|---|
| Element interface | `analytics/events/AnalyticsEvent.js` — defines `accept(visitor)` |
| Concrete elements (8) | `ReservationCreatedEvent`, `BookingConfirmedEvent`, `PaymentProcessedEvent`, `VehicleReturnedEvent`, `ParkingReservedEvent`, `ParkingReleasedEvent`, `TransitQueryEvent`, `GatewayCallEvent` |
| Visitor interface | `analytics/visitors/IAnalyticsVisitor.js` — declares `visit(event)` |
| Concrete visitor A | `analytics/visitors/PersistenceVisitor.js` — persists to Firestore |
| Concrete visitor B | `analytics/visitors/LoggingVisitor.js` — logs to stdout |
| Client | `services/AnalyticsListener.js` |
| Publisher | `mvc/MobilityService.js` |

**How it works**

Each concrete element implements `accept(visitor)`, which calls `visitor.visit(this)`. The visitor declares a single `visit(event)` method and operates on the common `AnalyticsEvent` interface (`event.type`, `event.city`, `event.metadata`) — no `instanceof` checks are needed. New operations over the entire event hierarchy are added by creating new visitor classes; no event class ever changes.

```js
// AnalyticsEvent — element interface
class AnalyticsEvent {
  get type()     { throw new Error('must implement'); }
  get city()     { return null; }
  get metadata() { return {}; }
  accept(visitor){ throw new Error('must implement'); }
}

// ReservationCreatedEvent — concrete element
class ReservationCreatedEvent extends AnalyticsEvent {
  constructor({ city, vehicleType, optionId, userId }) { super(); ... }
  get type()     { return 'RESERVATION_CREATED'; }
  get city()     { return this._city; }
  get metadata() { return { vehicleType: this._vehicleType, optionId: this._optionId, userId: this._userId }; }
  accept(visitor){ visitor.visit(this); }
  //  ↑ 1st dispatch: runtime type of event selects ReservationCreatedEvent.accept
  //                   ↑ 2nd dispatch: routes to the concrete visitor's visit()
}

// BookingConfirmedEvent, PaymentProcessedEvent, ... — same structure, own data

// IAnalyticsVisitor — visitor interface
class IAnalyticsVisitor {
  visit(event) { throw new Error('IAnalyticsVisitor.visit() must be implemented'); }
}

// PersistenceVisitor — concrete visitor A
class PersistenceVisitor extends IAnalyticsVisitor {
  visit(event) {
    AnalyticsReport.trackEvent(event.type, event.city, event.metadata).catch(() => {});
  }
}

// LoggingVisitor — concrete visitor B
class LoggingVisitor extends IAnalyticsVisitor {
  visit(event) {
    const meta = Object.entries(event.metadata).map(([k, v]) => `${k}=${v}`).join(' ');
    console.log(`[analytics] ${event.type} city=${event.city ?? 'n/a'} ${meta}`);
  }
}

// AnalyticsListener — client; applies both visitors to every event
EventBus.on('RESERVATION_CREATED', (event) => {
  event.accept(persistenceVisitor);   // → PersistenceVisitor.visit(event)
  event.accept(loggingVisitor);       // → LoggingVisitor.visit(event)
});

// MobilityService — emits typed event objects onto EventBus
EventBus.emit('RESERVATION_CREATED',
  new ReservationCreatedEvent({ city: option.city, vehicleType: option.type, optionId, userId })
);
```

Adding a `NotificationVisitor` = one new class + two lines in `AnalyticsListener`. No event class is modified.

**SOLID / GRASP**
- **Open/Closed**: open to new visitors (new operations), closed to modification of event classes.
- **Single Responsibility**: each visitor has one responsibility — persist, log, or notify.
- **Low Coupling**: event classes have no knowledge of how they are processed; they only call `visitor.visit(this)`.

---

## Visitor — Concrete Elements

| Event class | File | Emitted by |
|---|---|---|
| `ReservationCreatedEvent` | `analytics/events/` | `createReservation` |
| `BookingConfirmedEvent` | `analytics/events/` | `processPayment` |
| `PaymentProcessedEvent` | `analytics/events/` | `processPayment` |
| `VehicleReturnedEvent` | `analytics/events/` | `returnVehicle` |
| `ParkingReservedEvent` | `analytics/events/` | `reserveParkingSpot` |
| `ParkingReleasedEvent` | `analytics/events/` | `releaseParkingSpot` |
| `TransitQueryEvent` | `analytics/events/` | `getTransitSchedule` / `getNearbyStops` |
| `GatewayCallEvent` | `analytics/events/` | Any gateway factory call |
| `RideJoinedEvent` | `analytics/events/` | `joinRide` |

---

## GRASP Principles

| Principle | Applied in SUMMS |
|---|---|
| **Information Expert** | `MobilityService` owns all business logic — it has all the information needed. `BookingStateMachine` owns all transition rules. |
| **Creator** | `MobilityDataGateway` creates bookings and receipts — it has the required data. |
| **Controller** | `MobilityController` is the GRASP Controller — receives HTTP requests, delegates to Model, contains no business logic. |
| **Low Coupling** | `EventBus` decouples analytics from `MobilityService`. `MobilityDataGateway` decouples `MobilityService` from Firestore. |
| **High Cohesion** | Each class has one responsibility: `MobilityService` (business logic), `MobilityPresenter` (output formatting), `MobilityDataMapper` (shape translation). |
| **Protected Variation** | `IPricingStrategy` shields against pricing changes. `MobilityDataGateway` shields against database changes. `IPaymentGateway` shields against payment provider changes. |
| **Pure Fabrication / Indirection** | `EventBus` (intermediary), `BookingStateMachine` (invented for transition management), `MobilityDataMapper` (invented for shape translation). |

---

## SOLID Principles

| Principle | Applied in SUMMS |
|---|---|
| **Single Responsibility** | `MobilityController`: HTTP only. `MobilityService`: business logic only. `MobilityDataGateway`: data access only. `MobilityPresenter`: output formatting only. Each command class: one operation only. |
| **Open/Closed** | New gateway → add to `GATEWAY_MAP`. New command → add class + registry entry. New analytics operation → add one visitor class. No existing code modified in any case. |
| **Liskov Substitution** | `MockPaymentGateway` fully satisfies `IPaymentGateway`. `PeakHourPricingStrategy` fully satisfies `IPricingStrategy`. Any concrete visitor fully satisfies `IAnalyticsVisitor`. |
| **Interface Segregation** | All interfaces are narrow: `IPaymentGateway` (2 methods), `ITransitGateway` (2 methods), `IPricingStrategy` (1 method), `ICommand` (1 method). |
| **Dependency Inversion** | `MobilityService` depends on gateway abstractions. `PricingContext` depends on `IPricingStrategy`. `MobilityRequestHandler` depends on `ICommand`. |

---

## Implementation Notes (Ride Sharing + Availability)

### Ride Sharing data model
Bookings have three additional fields: `rideSharing: boolean`, `maxPassengers: number` (0–3), `passengers: string[]` (Firebase UIDs). These are additive — existing bookings default to `rideSharing: false, maxPassengers: 0, passengers: []` via `?? fallback` in `MobilityDataMapper.toBooking`.

`pickupLocation` is stored as `{ lat, lng, address? }`. The `address` field is optional and human-readable. Zod validation (`createDraftSchema`) explicitly permits it — without the field in the schema Zod strips unknown keys by default.

### Availability API contract
`GET /mobility/options/search` returns per-option availability as three fields:
- `availability: boolean` — whether at least one slot is free
- `remaining: number` — slots not yet taken in the requested window
- `capacity: number` — total capacity of this option (always 1 for vehicle options)

`MobilitySearchService` uses `AvailabilityService.checkAvailabilityBatch` — a single Firestore read for all DRAFT+ACTIVE bookings, then in-memory filtering per option. This replaced N parallel `isAvailable` calls (one per option).

### Firestore compound query avoidance
`Booking.findActiveRideShares` originally queried `.where('status','==','ACTIVE').where('rideSharing','==',true)`. This compound equality query on two different fields requires a composite index in Firestore (not auto-created). It was replaced with a single-field query on `status` and an in-memory filter on `rideSharing`, eliminating the index dependency.

### RideShare page — dual-section layout
`RideShare.jsx` fetches two data sources in parallel:
1. `GET /bookings/rideshare` — rides available to join (excludes full rides, excludes own ride)
2. `GET /bookings` — own bookings, filtered for `ACTIVE + rideSharing === true`

The driver's own ride is displayed in a "Your active ride" section regardless of seat availability. Other users' rides appear in "Available rides". This ensures the driver always sees their ride even after it fills up, while passengers only see joinable rides.

### Map availability refresh timing
After a booking is confirmed on the map (`confirmPendingBooking`), `loadRentalVehicles()` is **awaited** before the booking modal closes. This guarantees `mobilityOptionsRef` holds fresh availability data (including the newly consumed slot) before the user can interact with map markers again, preventing a race condition where stale `X/X available` counts appeared in InfoWindows.
