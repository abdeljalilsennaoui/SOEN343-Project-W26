# SUMMS — Smart Urban Mobility Management System

SOEN 343 – Software Architecture and Design (Phase II)

A unified platform for urban mobility services: bike-sharing, car-sharing, scooter rentals, parking, and public transit information.
<!-- Contributor note: this README is intentionally high-level and points to setup and architecture details elsewhere in the repo. -->

## Tech Stack

- **Frontend:** React + Vite (JavaScript)
- **Backend:** Node.js + Express.js
- **Database:** Google Firestore (Firebase)
- **Auth:** Firebase Authentication (email/password + Google OAuth)
- **Maps:** Google Maps JS API (markers, routing, geocoding, Places)
- **Testing:** Jest + Supertest
- **CI:** GitHub Actions

## Project Structure

```
├── frontend/            React application (Vite)
├── backend/             Express API server (MVC)
├── ARCHITECTURE/        Class diagram + design patterns docs
├── REPORT-WORK/         Phase II report artifacts (use cases, overview)
├── docs/                Diagrams and supporting material
├── CONTRIBUTING.md      Contribution guide
└── SETUP.md             Full developer setup guide
```

## Getting Started

See [SETUP.md](./SETUP.md) for full setup instructions including Firebase credentials and Google Maps API key.

### Prerequisites

- Node.js 18+
- npm 9+

### Backend

```bash
cd backend
npm install
npm run dev        # starts on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:5173
```

The frontend Vite dev server proxies `/api` requests to the backend automatically.

## API Endpoints (all prefixed `/api`)

### Core
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | — | Health check |
| POST | `/users/register` | — | Register user |
| GET | `/users/me` | ✓ | Get own profile |
| GET | `/vehicles?city=&type=` | — | List vehicles |
| GET | `/mobility/options/search?city=&startTime=&endTime=` | — | Search options with live availability (`availability`, `remaining`, `capacity`) |

### Booking lifecycle (COMMUTER role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings/draft` | Create draft booking (supports `rideSharing`, `maxPassengers`, `pickupLocation.address`) |
| POST | `/bookings/:id/confirm` | Confirm + process payment |
| POST | `/bookings/:id/complete` | Complete ride |
| GET | `/bookings` | Get own bookings |

### Ride Sharing (COMMUTER role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookings/rideshare` | List active shared rides with seats available |
| POST | `/bookings/rideshare/:id/join` | Join a shared ride |
| POST | `/bookings/rideshare/:id/leave` | Leave a shared ride |

### Provider (MOBILITY_PROVIDER role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/provider/vehicles` | List own vehicles |
| POST | `/provider/vehicles` | Add vehicle + matching mobility option |
| PUT | `/provider/vehicles/:id` | Update vehicle |
| DELETE | `/provider/vehicles/:id` | Deactivate vehicle |

### Parking & Transit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/parking/facilities?city=` | List parking facilities |
| GET | `/parking/facilities/:id/spots` | Get facility spots |
| GET | `/parking/spots/available?city=` | List available spots |
| POST | `/parking/spots/reserve` | Reserve a spot |
| POST | `/parking/spots/release` | Release a spot |
| GET | `/parking/nearby?lat=&lng=&radius=&maxResults=` | Nearby parkings (OverpassParkingGateway) |
| GET | `/transit/schedule?city=&line=` | Transit schedule (GtfsTransitGateway) |
| GET | `/transit/stops/nearby?lat=&lng=` | Nearby transit stops |

### Analytics (MOBILITY_PROVIDER | CITY_ADMINISTRATOR | SYSTEM_ADMINISTRATOR)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics` | Raw analytics events (legacy endpoint) |
| GET | `/analytics/rentals` | Rental analytics |
| GET | `/analytics/gateway` | Gateway call analytics |

## Architecture

MVC with 8 GoF design patterns. See [ARCHITECTURE/CLASS_DIAGRAM.md](./ARCHITECTURE/CLASS_DIAGRAM.md) and [ARCHITECTURE/DESIGN_PATTERNS.md](./ARCHITECTURE/DESIGN_PATTERNS.md).

```
View (React) → MobilityController → MobilityRequestHandler
             → ConcreteCommand → MobilityService
             → MobilityDataGateway → MobilityDataMapper → Firestore
             → MobilityResponse → MobilityPresenter → View
```

## Running Tests

```bash
cd backend
npm test              # run all tests
npm run test:coverage # with coverage report
```

## Team — Group 1

| Name | Student ID | GitHub |
|------|------------|--------|
| Subaanky Krishnapillai | 40128716 | [@Subaanky](https://github.com/Subaanky) |
| Andra Vele | 40175695 | [@avele24](https://github.com/avele24) |
| Mohamed Ahmed | 40229758 | [@SSOBHY2](https://github.com/SSOBHY2) |
| Quentin Bollore | 40348932 | [@quentinbol](https://github.com/quentinbol) |
| Abdeljalil Sennaoui | 40117162 | [@abdeljalilsennaoui](https://github.com/abdeljalilsennaoui) |
| Sara Rezene Habte | 40224677 | [@SaraH6734](https://github.com/SaraH6734) |
