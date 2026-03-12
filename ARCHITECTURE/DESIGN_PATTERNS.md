# SUMMS — Design Patterns

> Documents every design pattern applied in Sprint 3, following the SOEN 343
> course requirement format: problem → why it fits → participants → benefits →
> consequences if not used → GRASP/architecture alignment.

---

## Applied Patterns Summary

| Pattern | Category | File(s) | Solves |
|---|---|---|---|
| Observer | GoF Behavioural | `lib/EventBus.js`, `services/AnalyticsListener.js` | Decouples analytics from business logic |
| Facade | GoF Structural | `services/BookingFacade.js` | Simplifies multi-subsystem booking workflow |
| Factory Method | GoF Creational | `gateways/index.js` | Centralises gateway instantiation |
| State | GoF Behavioural | `lib/BookingStateMachine.js` | Enforces booking lifecycle transitions |
| Adapter | GoF Structural | `services/TransitAdapter.js`, `services/ParkingAdapter.js` | Normalises external gateway responses |
| Strategy | GoF Behavioural | `gateways/payment/IPaymentGateway.js` | Swappable payment algorithm |
| Singleton | GoF Creational | `lib/EventBus.js`, all controllers | Shared single resource |

---

## 1. Observer

**Files:**
- Subject: `backend/src/lib/EventBus.js`
- Subscriber: `backend/src/services/AnalyticsListener.js`
- Publishers: `BookingService.js`, `ParkingController.js`, `TransitAdapter.js`

### Design Problem
Analytics tracking was embedded directly inside service and controller methods. Every time a booking was confirmed or a parking spot was reserved, the business logic had to call `AnalyticsReport.trackEvent(...)` directly. This coupled unrelated concerns — a booking confirmation cares about payments and state transitions, not about writing analytics records. Adding a new analytic meant modifying existing business code.

### Why the Pattern Fits
The Observer pattern defines a one-to-many dependency: when a subject changes state, all registered observers are notified automatically. Domain events (BOOKING_CONFIRMED, PAYMENT_PROCESSED, TRANSIT_QUERY, etc.) are natural subjects. `AnalyticsListener` is the concrete observer. Neither side imports the other — they communicate only through `EventBus`.

### Participating Classes
| Role | Class / File |
|---|---|
| Subject (Event Bus) | `lib/EventBus.js` — Node EventEmitter singleton |
| Concrete Observer | `services/AnalyticsListener.js` — calls `AnalyticsReport.trackEvent()` |
| Publisher (BookingService) | emits `BOOKING_CONFIRMED`, `PAYMENT_PROCESSED`, `RESERVATION_CREATED` |
| Publisher (ParkingController) | emits `PARKING_RESERVED`, `PARKING_RELEASED` |
| Publisher (TransitAdapter) | emits `TRANSIT_QUERY`, `GATEWAY_CALL` |
| Data sink | `models/AnalyticsReport.js` — Firestore write |

### Benefits
- Adding a new subscriber (e.g. email notification) requires zero changes to existing business code — just register a new handler on `EventBus`.
- Analytics failures never block a business response (fire-and-forget `.catch(() => {})`).
- Publishers and subscribers are independently testable.

### Consequences if Not Used
Every service and controller would directly import and call `AnalyticsReport`. A change to how analytics are stored would require modifying multiple unrelated files. Any analytics error could propagate and fail a booking response.

### GRASP / Architecture Alignment
- **Low Coupling**: publishers and subscribers share only the event name string — no direct import.
- **Indirection / Pure Fabrication**: `EventBus` is an invented intermediary that reduces coupling between the service and analytics layers.
- **Open/Closed Principle**: the system is open for adding new analytics events without modifying existing publishers.

---

## 2. Facade

**Files:**
- `backend/src/services/BookingFacade.js`
- Client: `backend/src/controllers/BookingController.js`
- Subsystems: `BookingService.js`, `MobilitySearchService.js`

### Design Problem
The booking workflow spans multiple subsystems: mobility option search (`MobilitySearchService`), lifecycle management (`BookingService`), availability checking (`AvailabilityService`), pricing (`PricingService`), and payment processing. A controller that orchestrates all of these directly would import and depend on every subsystem — a bloated controller that violates Low Coupling and High Cohesion.

### Why the Pattern Fits
Facade provides a single, simplified interface over a complex subsystem. `BookingFacade` exposes exactly the five operations a booking controller needs (`searchOptions`, `createDraft`, `confirmDraft`, `completeBooking`, `getMyBookings`), hiding which subsystems are involved and how they interact.

### Participating Classes
| Role | Class / File |
|---|---|
| Facade | `services/BookingFacade.js` |
| Client | `controllers/BookingController.js` |
| Subsystem A | `services/BookingService.js` |
| Subsystem B | `services/MobilitySearchService.js` |

### Benefits
- `BookingController` imports only `BookingFacade` — no direct service or model imports.
- Adding a new workflow step (e.g. sending a confirmation email after `confirmDraft`) requires changing only `BookingFacade`, not the controller.
- Subsystem services remain independently reusable by other controllers.

### Consequences if Not Used
`BookingController` would import `BookingService`, `MobilitySearchService`, `AvailabilityService`, and `PricingService` directly — a god controller with high coupling to every subsystem. Any refactoring of a subsystem would ripple into the controller.

### GRASP / Architecture Alignment
- **Indirection / Pure Fabrication**: `BookingFacade` is an invented class with no domain meaning — it exists purely to reduce coupling between the controller layer and the service subsystems.
- **High Cohesion**: the controller's responsibility is now narrowly defined (HTTP ↔ facade).
- **Layered Architecture**: enforces the clean path `Route → Controller → Facade → Service → Model`.

---

## 3. Factory Method

**Files:**
- `backend/src/gateways/index.js` (factory)
- `backend/src/gateways/payment/MockPaymentGateway.js`
- `backend/src/gateways/transit/MockTransitGateway.js`
- `backend/src/gateways/parking/MockParkingGateway.js`

### Design Problem
Services that call `new MockPaymentGateway()` directly are coupled to the concrete implementation class. If the production payment gateway (e.g. Stripe) is added later, every call site would need to change. The same problem applies to transit and parking gateways.

### Why the Pattern Fits
Factory Method centralises object creation behind a method. The `GATEWAY_MAP` lookup table is the single variation point. Callers ask for a gateway by type; the factory decides which concrete class to instantiate. Swapping mock → real gateway requires changing only `GATEWAY_MAP` in one file.

### Participating Classes
| Role | Class / File |
|---|---|
| Factory | `gateways/index.js` — `createGateway(type)` + typed helpers |
| Product interfaces | `IPaymentGateway`, `ITransitGateway`, `IParkingGateway` |
| Concrete products | `MockPaymentGateway`, `MockTransitGateway`, `MockParkingGateway` |
| Clients | `BookingService`, `TransitAdapter`, `ParkingAdapter` |

### Benefits
- Replacing a mock with a real gateway = one line change in `GATEWAY_MAP`.
- Clients are programmed to the interface (`IPaymentGateway.charge()`), not the implementation.
- New gateway types can be added to the factory without touching any client code.

### Consequences if Not Used
Every service would call `new MockPaymentGateway()` directly. Moving to production requires finding and updating every instantiation site. DIP is violated because high-level modules depend on low-level concrete classes.

### GRASP / Architecture Alignment
- **Protected Variation**: `GatewayFactory` is the protected variation point for all external service creation.
- **Dependency Inversion Principle**: services depend on `IPaymentGateway` (abstraction), not `MockPaymentGateway` (detail).
- **Low Coupling**: clients never reference a concrete gateway class.

---

## 4. State

**Files:**
- `backend/src/lib/BookingStateMachine.js`
- Context: `backend/src/services/BookingService.js`

### Design Problem
The booking lifecycle has a strict finite state machine: `DRAFT → ACTIVE → COMPLETE` and `DRAFT → FAILED`. Before this pattern was applied, `BookingService.confirmDraft` and `BookingService.completeBooking` each had their own scattered `if (booking.status !== ...)` checks. These were duplicated, inconsistent, and easy to miss when adding new states.

### Why the Pattern Fits
The State pattern encapsulates state-dependent behaviour and valid transition rules in one dedicated class. `BookingStateMachine` is the single source of truth for which transitions are allowed. Any invalid transition throws a 409 immediately before any side effect (payment, Firestore write) occurs.

### Participating Classes
| Role | Class / File |
|---|---|
| State Machine | `lib/BookingStateMachine.js` — `transition()`, `canTransition()` |
| State identifiers | `models/enums.js` `BookingStatus` |
| Context (client) | `services/BookingService.js` — calls `BookingStateMachine.transition(booking, newStatus)` |

### Benefits
- All transition rules in one file — adding a new state (e.g. `CANCELLED`) requires one new entry in `TRANSITIONS`.
- Consistent 409 error response on any illegal move, regardless of which service method is called.
- `BookingService` no longer contains scattered, duplicated status checks.

### Consequences if Not Used
`BookingService` would contain repeated `if (status !== 'DRAFT') throw ...` checks across multiple methods. These are error-prone, hard to keep consistent, and will diverge as the lifecycle evolves.

### GRASP / Architecture Alignment
- **Pure Fabrication**: `BookingStateMachine` is not a domain entity — it is invented to manage behaviour, keeping `BookingService` cohesive.
- **High Cohesion**: all transition logic is in one class with a single, clear responsibility.
- **Information Expert**: `BookingStateMachine` owns the transition rules and is the right place to enforce them.

---

## 5. Adapter

**Files:**
- `backend/src/services/TransitAdapter.js`
- `backend/src/services/ParkingAdapter.js`
- Adaptees: `gateways/transit/ITransitGateway`, `gateways/parking/IParkingGateway`
- Clients: `TransitController`, `ParkingController`

### Design Problem
Raw gateway responses have a different shape from what the service and controller layers expect. For example, a transit gateway might return `{ latitude, longitude }` while the domain uses `{ lat, lng }`. Controllers and models cannot be modified to accommodate every gateway's quirks — especially when the gateway is external and may change independently.

### Why the Pattern Fits
The Adapter pattern translates an incompatible interface (the raw gateway response) into the target interface (the domain shape) without modifying either side. `TransitAdapter` and `ParkingAdapter` each wrap a gateway, normalise the response, and emit analytics events — all in one focused class.

### Participating Classes
| Role | Class / File |
|---|---|
| Adapter | `services/TransitAdapter.js` |
| Adapter | `services/ParkingAdapter.js` |
| Adaptee | `gateways/transit/ITransitGateway` (+ Mock) |
| Adaptee | `gateways/parking/IParkingGateway` (+ Mock) |
| Client | `controllers/TransitController.js` |
| Client | `controllers/ParkingController.js` |

### Benefits
- Gateway implementation changes don't propagate to controllers or models.
- Analytics emissions (TRANSIT_QUERY, GATEWAY_CALL) are co-located with the translation logic — a natural fit.
- Each adapter has a single responsibility: translate + emit.

### Consequences if Not Used
Controllers or models would contain translation logic (`stop.latitude → lat`) tightly coupling domain code to a specific external API's response shape. Any gateway change would require finding and updating every controller that uses it.

### GRASP / Architecture Alignment
- **Indirection**: adapters sit between the infrastructure gateway layer and the service/controller layer, preventing direct coupling.
- **Protected Variation**: if the external transit API changes its response shape, only `TransitAdapter` changes.
- **Single Responsibility Principle**: gateways handle external communication; adapters handle shape translation.

---

## 6. Strategy

**Files:**
- `backend/src/gateways/payment/IPaymentGateway.js` (strategy interface)
- `backend/src/gateways/payment/MockPaymentGateway.js` (concrete strategy)
- `backend/src/services/BookingService.js` (context)

### Design Problem
The payment processing algorithm needs to vary independently of the booking workflow. In development and testing a mock implementation is used; in production a real payment provider (e.g. Stripe) would be used. Hard-coding the payment logic inside `BookingService` would mean rewriting core business logic to switch providers.

### Why the Pattern Fits
The Strategy pattern defines a family of algorithms (payment processors), encapsulates each, and makes them interchangeable. `BookingService` depends only on `IPaymentGateway.charge()` — it does not know or care which concrete strategy is active. The strategy is resolved once at startup via `GatewayFactory`.

### Participating Classes
| Role | Class / File |
|---|---|
| Strategy interface | `gateways/payment/IPaymentGateway.js` |
| Concrete strategy | `gateways/payment/MockPaymentGateway.js` |
| Context | `services/BookingService.js` — calls `paymentGateway.charge()` |
| Resolver | `gateways/index.js` — `createPaymentGateway()` |

### Benefits
- Swapping mock → Stripe = change one line in `GatewayFactory`.
- `BookingService` contains zero payment-provider-specific code.
- New payment strategies can be added without modifying the booking workflow.

### Consequences if Not Used
`BookingService` would contain `if (process.env.NODE_ENV === 'test') { ... } else { ... }` payment branching — violating OCP and entangling infrastructure concerns with domain logic.

### GRASP / Architecture Alignment
- **Protected Variation**: the `IPaymentGateway` interface is the variation point that shields `BookingService` from payment provider changes.
- **Dependency Inversion Principle**: `BookingService` depends on the abstraction (`IPaymentGateway`), not the concrete class.
- **Low Coupling**: `BookingService` has no import of any concrete gateway.

---

## 7. Singleton

**Files:**
- `backend/src/lib/EventBus.js`
- All controllers (`BookingController`, `ProviderController`, etc.)
- All service singletons (`BookingFacade`, `BookingStateMachine`)

### Design Problem
`EventBus` must be a single shared instance across the entire application — if multiple instances existed, publishers and subscribers would register on different buses and events would never reach their handlers. Similarly, controllers are stateless request handlers with no reason to be instantiated more than once.

### Why the Pattern Fits
Singleton is appropriate only when a true single shared resource exists. `EventBus` is a classic case: it is a shared communication channel and must be the same object everywhere. Controllers are also singletons because they hold no mutable state — sharing one instance is both safe and efficient.

### Participating Classes
| Role | Class / File |
|---|---|
| Singleton (infrastructure) | `lib/EventBus.js` — `module.exports = bus` (single instance) |
| Singleton (state machine) | `lib/BookingStateMachine.js` — `module.exports = new BookingStateMachine()` |
| Singleton (facade) | `services/BookingFacade.js` — `module.exports = new BookingFacade()` |
| Singletons (controllers) | All controllers — `module.exports = new BookingController()` etc. |

### Benefits
- Guaranteed single EventBus instance — all publishers and subscribers share the same channel.
- No unnecessary object creation for stateless controllers.

### Consequences if Not Used
Multiple `EventBus` instances would mean events emitted by `BookingService` would never reach `AnalyticsListener` if they hold different instances. The Observer pattern would silently stop working.

### GRASP / Architecture Alignment
- **Low Coupling**: Node's module system caches `require()` results, making this the natural Singleton mechanism without a complex `getInstance()` method.
- Applied only where a shared single resource genuinely exists — not as a default for every class.

---

## GRASP Principles Applied

| Principle | Where Applied |
|---|---|
| **Information Expert** | `PricingService` calculates price (owns option data). `AvailabilityService` checks conflicts (owns booking data). |
| **Creator** | `Booking.create()` creates booking documents. `PaymentReceipt.create()` creates receipts. |
| **Controller** | All `*Controller` classes handle HTTP requests and delegate — no business logic. |
| **Low Coupling** | EventBus decouples publishers from AnalyticsListener. Adapters decouple controllers from gateways. |
| **High Cohesion** | Each service has one responsibility. `BookingStateMachine` owns only transition rules. |
| **Protected Variation** | `IPaymentGateway`, `ITransitGateway`, `IParkingGateway` interfaces shield services from implementation changes. |
| **Indirection / Pure Fabrication** | `EventBus` (intermediary), `BookingFacade` (intermediary), `BookingStateMachine` (invented to manage behaviour). |

---

## SOLID Principles Compliance

| Principle | How it is upheld |
|---|---|
| **Single Responsibility** | Each class/module has one reason to change. Controllers handle HTTP. Services handle logic. Models handle persistence. |
| **Open/Closed** | New gateway types: add to `GATEWAY_MAP`. New analytics events: add `EventBus.on(...)` in `AnalyticsListener`. No existing code modified. |
| **Liskov Substitution** | `MockPaymentGateway` fully satisfies the `IPaymentGateway` contract. `BookingService` works identically with any implementation. |
| **Interface Segregation** | Gateway interfaces are narrow (`IPaymentGateway`: 2 methods, `ITransitGateway`: 2 methods). No fat interfaces. |
| **Dependency Inversion** | `BookingService` depends on `IPaymentGateway` (abstraction). `TransitAdapter` depends on `ITransitGateway` (abstraction). High-level modules never depend on low-level concrete classes. |
