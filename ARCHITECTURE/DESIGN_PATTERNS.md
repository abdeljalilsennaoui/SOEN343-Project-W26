# SUMMS — Design Patterns

> Documents every design pattern applied in SUMMS, showing how each one
> fits within the MVC architecture and which GRASP principles it supports.

---

## Architecture: MVC

SUMMS follows the Model-View-Controller (MVC) architecture:

| Layer | Responsibility | Key Files |
|---|---|---|
| **View** | Display data, capture user input | React pages, `api.js` |
| **Controller** | Receive requests, coordinate Model ↔ View | `MobilityController`, `MobilityPresenter` |
| **Model** | Business logic, entities, data access | `MobilityService`, `MobilityRequestHandler`, `MobilityDataGateway`, `MobilityDataMapper`, domain entities |

Request flow:
```
View → Controller → MobilityRequest → MobilityRequestHandler
     → MobilityService → MobilityDataGateway → SUMMSDatabase
     → MobilityResponse → MobilityPresenter → View
```

---

## Applied Patterns Summary

| Pattern | Category | File(s) | Solves |
|---|---|---|---|
| Observer | GoF Behavioural | `lib/EventBus.js`, `services/AnalyticsListener.js` | Decouples analytics from business logic |
| Factory Method | GoF Creational | `gateways/index.js` | Centralises gateway instantiation |
| State | GoF Behavioural | `lib/BookingStateMachine.js` | Enforces booking lifecycle transitions |
| Adapter | GoF Structural | `mvc/MobilityDataGateway.js`, `mvc/MobilityDataMapper.js` | Normalises Firestore records and external service responses into domain entities |
| Strategy | GoF Behavioural | `gateways/payment/IPaymentGateway.js` | Swappable payment algorithm |
| Singleton | GoF Creational | `EventBus`, `MobilityController`, `MobilityService` | Shared single resource |

---

## 1. Observer

**Files:**
- Subject: `backend/src/lib/EventBus.js`
- Subscriber: `backend/src/services/AnalyticsListener.js`
- Publishers: `mvc/MobilityService.js`

### Design Problem
Analytics tracking must not be embedded inside `MobilityService`. The service handles the rental lifecycle (reservation, payment, return) and must not depend on how analytics are stored. If analytics logic changes, business logic should not be affected.

### Why the Pattern Fits
The Observer pattern defines a one-to-many dependency where subscribers are notified of events without the publisher knowing who listens. `MobilityService` emits domain events (BOOKING_CONFIRMED, PAYMENT_PROCESSED, etc.) on `EventBus`. `AnalyticsListener` subscribes and persists the events independently.

### Participating Classes (within MVC)
| MVC Layer | Role | Class / File |
|---|---|---|
| Model | Subject (Event Bus) | `lib/EventBus.js` |
| Model | Publisher | `mvc/MobilityService.js` |
| Model | Concrete Observer | `services/AnalyticsListener.js` |
| Model | Data sink | `models/AnalyticsReport.js` |

### Benefits
- `MobilityService` emits one line per event — no knowledge of analytics storage.
- Adding new analytics (e.g. email notification) requires only a new `EventBus.on(...)` — no changes to MobilityService.
- Analytics failures never block a booking response (fire-and-forget `.catch(() => {})`).

### Consequences if Not Used
`MobilityService` would call `AnalyticsReport.trackEvent(...)` directly after every operation, coupling the Model's business logic to its own internal monitoring system and violating Low Coupling.

### GRASP / Architecture Alignment
- **Low Coupling**: publishers and subscribers share only an event name string.
- **MVC alignment**: the Model notifies observers of state changes without any dependency on the View or Controller — consistent with the MVC Observer principle stated in the report.
- **Open/Closed Principle**: open to new subscribers, closed to modification of publishers.

---

## 2. Factory Method

**Files:**
- `backend/src/gateways/index.js`
- `backend/src/gateways/payment/MockPaymentGateway.js`
- `backend/src/gateways/transit/MockTransitGateway.js`
- `backend/src/gateways/parking/MockParkingGateway.js`

### Design Problem
`MobilityService` requires a payment gateway, a transit gateway, and a parking gateway. Calling `new MockPaymentGateway()` directly couples the service to a concrete implementation. Replacing mock gateways with real ones (Stripe, STM API) would require modifying every call site.

### Why the Pattern Fits
Factory Method centralises object creation behind a method. The `GATEWAY_MAP` lookup table is the single variation point. Calling `createPaymentGateway()` returns whichever implementation is registered — the calling service does not know or care which one.

### Participating Classes (within MVC)
| MVC Layer | Role | Class / File |
|---|---|---|
| Model (Infrastructure) | Factory | `gateways/index.js` — `createGateway(type)` |
| Model (Infrastructure) | Product interface | `IPaymentGateway`, `ITransitGateway`, `IParkingGateway` |
| Model (Infrastructure) | Concrete products | `MockPaymentGateway`, `MockTransitGateway`, `MockParkingGateway` |
| Model | Client | `mvc/MobilityService.js` |

### Benefits
- Swapping mock → real gateway = one line change in `GATEWAY_MAP`.
- `MobilityService` is programmed to interfaces, not implementations.
- New gateway types can be added without touching any existing code.

### Consequences if Not Used
`MobilityService` would directly instantiate concrete gateway classes — violating the Dependency Inversion Principle and making gateway replacement a surgical multi-file change.

### GRASP / Architecture Alignment
- **Protected Variation**: the factory is the variation point for all external service creation.
- **Dependency Inversion Principle**: Model business logic depends on abstractions (interfaces), not concrete classes.

---

## 3. State

**Files:**
- `backend/src/lib/BookingStateMachine.js`
- Context: `backend/src/mvc/MobilityService.js`

### Design Problem
The booking lifecycle enforces a strict state machine: `DRAFT → ACTIVE → COMPLETE` and `DRAFT → FAILED`. Without a dedicated class, `MobilityService.processPayment()` and `MobilityService.returnVehicle()` would each contain their own status validation checks — duplicated, inconsistent, and easy to miss.

### Why the Pattern Fits
The State pattern encapsulates all valid transitions in one class. `BookingStateMachine.transition(booking, toStatus)` is the single enforcement point — it throws a 409 on any illegal move before any side effect (payment charge, Firestore write) occurs.

### Participating Classes (within MVC)
| MVC Layer | Role | Class / File |
|---|---|---|
| Model (Domain) | State machine | `lib/BookingStateMachine.js` |
| Model | Context (client) | `mvc/MobilityService.js` |
| Model | State identifiers | `models/enums.js` `BookingStatus` |

### Benefits
- All transition rules in one place — adding a new state (e.g. `CANCELLED`) = one new entry in `TRANSITIONS`.
- Consistent 409 response on any illegal move, regardless of which service method calls it.
- `MobilityService` contains no scattered status if-checks.

### Consequences if Not Used
`MobilityService` would have repeated `if (booking.status !== 'DRAFT') throw ...` checks duplicated across `processPayment` and `returnVehicle`, which are easy to diverge and hard to test uniformly.

### GRASP / Architecture Alignment
- **Pure Fabrication**: `BookingStateMachine` is not a domain entity — invented solely to manage behaviour, keeping `MobilityService` cohesive.
- **High Cohesion**: all transition logic in one class with a single clear responsibility.
- **Information Expert**: the state machine owns the transition rules and is the right place to enforce them.

---

## 4. Adapter

**Files:**
- `backend/src/mvc/MobilityDataGateway.js` (adapts Firestore model modules)
- `backend/src/mvc/MobilityDataMapper.js` (normalises document shapes)

### Design Problem
Firestore returns raw document objects whose fields may not match the domain entity shape expected by `MobilityService`. Similarly, external transit and parking gateways return data in their own proprietary shapes. The Model layer cannot be modified every time an external format changes.

### Why the Pattern Fits
The Adapter pattern translates an incompatible interface into the target interface without modifying either side. `MobilityDataGateway` adapts Firestore model modules into a unified data access interface. `MobilityDataMapper` translates raw Firestore documents into typed domain entities.

### Participating Classes (within MVC)
| MVC Layer | Role | Class / File |
|---|---|---|
| Model | Adapter | `mvc/MobilityDataGateway.js` |
| Model | Shape translator | `mvc/MobilityDataMapper.js` |
| Model (Infrastructure) | Adaptee | Firestore model modules (`Booking.js`, `Vehicle.js`, etc.) |
| Model | Client | `mvc/MobilityService.js` |

### Benefits
- `MobilityService` calls `MobilityDataGateway.findBooking(id)` — it never knows about Firestore document structure.
- If Firestore is replaced with another database, only `MobilityDataGateway` and `MobilityDataMapper` change.
- Domain entities remain clean and independent of persistence format.

### Consequences if Not Used
`MobilityService` would call `Booking.findById(id)` and access raw Firestore fields directly, coupling the business logic layer to the database document format — any schema change would cascade throughout the Model.

> **Note (post-refactor):** Before this pattern was fully enforced, `VehicleController` and `ParkingController` called Firestore models directly, bypassing the MVC chain. These violations were eliminated — `GET /api/vehicles` and `GET /api/parking/facilities/:id/spots` now route through `MobilityController → MobilityRequestHandler → MobilityService → MobilityDataGateway` like all other endpoints.

### GRASP / Architecture Alignment
- **Protected Variation**: `MobilityDataGateway` is the protected variation point for all database access.
- **Low Coupling**: `MobilityService` has no import of any Firestore model module.
- **Indirection**: the gateway and mapper are intermediaries that prevent direct coupling between business logic and persistence.

---

## 5. Strategy

**Files:**
- `backend/src/gateways/payment/IPaymentGateway.js` (strategy interface)
- `backend/src/gateways/payment/MockPaymentGateway.js` (concrete strategy)
- `backend/src/mvc/MobilityService.js` (context)

### Design Problem
Payment processing must be swappable — the development system uses a mock gateway; production will use a real provider (e.g. Stripe). The business logic in `MobilityService.processPayment()` must not change when the payment provider changes.

### Why the Pattern Fits
The Strategy pattern defines a family of algorithms, encapsulates each, and makes them interchangeable. `MobilityService` calls `paymentGateway.charge(amount, details)` against the `IPaymentGateway` interface — it never references any concrete class.

### Participating Classes (within MVC)
| MVC Layer | Role | Class / File |
|---|---|---|
| Model (Infrastructure) | Strategy interface | `gateways/payment/IPaymentGateway.js` |
| Model (Infrastructure) | Concrete strategy | `gateways/payment/MockPaymentGateway.js` |
| Model | Context | `mvc/MobilityService.js` |
| Model | Resolver | `gateways/index.js` `createPaymentGateway()` |

### Benefits
- Swapping mock → Stripe = one line change in `GatewayFactory`.
- `MobilityService` contains zero payment-provider-specific code.
- New payment strategies can be added without modifying any existing class.

### Consequences if Not Used
`MobilityService` would contain `if (env === 'production') { stripeCharge() } else { mockCharge() }` branching — violating OCP and entangling infrastructure concerns inside the Model's business logic.

### GRASP / Architecture Alignment
- **Protected Variation**: `IPaymentGateway` shields `MobilityService` from payment provider changes.
- **Dependency Inversion Principle**: Model business logic depends on the abstraction, not the concrete class.

---

## 6. Singleton

**Files:**
- `backend/src/lib/EventBus.js`
- `backend/src/mvc/MobilityController.js`
- `backend/src/mvc/MobilityService.js`
- `backend/src/mvc/MobilityRequestHandler.js`
- `backend/src/mvc/MobilityPresenter.js`
- `backend/src/mvc/MobilityDataGateway.js`

### Design Problem
`EventBus` must be a single shared instance across the application — if multiple instances existed, publishers and subscribers would register on different buses and events would never reach their handlers. The MVC component classes (MobilityController, MobilityService, etc.) are stateless and have no reason to be instantiated more than once.

### Why the Pattern Fits
Singleton is appropriate only where a true single shared resource exists. `EventBus` is a shared communication channel. The MVC components hold no mutable state — sharing one instance per class is safe and efficient. Node's `module.exports = new Class()` pattern provides a natural singleton via the module cache.

### Participating Classes (within MVC)
| MVC Layer | Class |
|---|---|
| Infrastructure | `lib/EventBus.js` |
| Controller | `mvc/MobilityController.js` |
| Model | `mvc/MobilityService.js`, `MobilityRequestHandler.js`, `MobilityPresenter.js`, `MobilityDataGateway.js` |

### Benefits
- Guaranteed single `EventBus` — all publishers and subscribers share the same channel.
- No unnecessary object creation for stateless MVC components.

### Consequences if Not Used
Multiple `EventBus` instances would silently break the Observer pattern — events emitted by `MobilityService` would never reach `AnalyticsListener`.

### GRASP / Architecture Alignment
- Applied only where a shared single resource genuinely exists — not as a default for every class.
- Node's `require()` cache makes this the natural mechanism without a complex `getInstance()` method.

---

## GRASP Principles Applied

| Principle | Where Applied |
|---|---|
| **Information Expert** | `MobilityService` owns all business logic — it has all the information to execute operations. `BookingStateMachine` owns all transition rules. |
| **Creator** | `MobilityDataGateway.saveBooking()` creates bookings. `MobilityDataGateway.saveReceipt()` creates receipts. |
| **Controller** | `MobilityController` is the GRASP Controller — receives system events (HTTP requests), delegates to the Model, never contains business logic. |
| **Low Coupling** | `EventBus` decouples analytics from `MobilityService`. `MobilityDataGateway` decouples `MobilityService` from Firestore. |
| **High Cohesion** | Each MVC class has one responsibility. `MobilityService` handles business logic only. `MobilityPresenter` formats output only. `MobilityDataMapper` translates shapes only. |
| **Protected Variation** | `IPaymentGateway` shields against payment provider changes. `MobilityDataGateway` shields against database changes. |
| **Indirection / Pure Fabrication** | `EventBus` (intermediary), `BookingStateMachine` (invented for transition management), `MobilityDataMapper` (invented for shape translation). |

---

## SOLID Principles Compliance

| Principle | How it is upheld |
|---|---|
| **Single Responsibility** | `MobilityController`: HTTP orchestration only. `MobilityService`: business logic only. `MobilityDataGateway`: data access only. `MobilityPresenter`: output formatting only. |
| **Open/Closed** | New gateway type → add to `GATEWAY_MAP`. New analytics event → add `EventBus.on(...)`. No existing code modified. |
| **Liskov Substitution** | `MockPaymentGateway` fully satisfies `IPaymentGateway`. `MobilityService` works identically with any payment implementation. |
| **Interface Segregation** | Gateway interfaces are narrow (2 methods each). `IPaymentGateway`: `charge`, `refund`. `ITransitGateway`: `getSchedule`, `getNearbyStops`. |
| **Dependency Inversion** | `MobilityService` depends on `IPaymentGateway` (abstraction). `MobilityDataGateway` abstracts all Firestore access from the service layer. |
