# SUMMS — Smart Urban Mobility Management System

SOEN 343 – Software Architecture and Design (Phase II)

A unified platform for urban mobility services: bike-sharing, car-sharing, scooter rentals, parking, and public transit information.

## Tech Stack

- **Frontend:** React + Vite (JavaScript)
- **Backend:** Node.js + Express.js
- **Database:** In-memory (PostgreSQL/Supabase planned)
- **Testing:** Jest + Supertest
- **CI:** GitHub Actions

## Project Structure

```
├── frontend/          React application
├── backend/           Express API server
├── docs/diagrams/     Architecture diagrams
└── scripts/           Helper scripts
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Backend

```bash
cd backend
npm install
npm run dev        # starts on http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:5173
```

The frontend dev server proxies `/api` requests to the backend automatically.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/vehicles?city=&type=` | List available vehicles |
| POST | `/api/reservations` | Create a reservation |
| POST | `/api/payments/charge` | Process payment |
| POST | `/api/returns` | Return vehicle and end reservation |

## Running Tests

```bash
cd backend
npm test              # run all tests
npm run test:coverage # with coverage report
```

## Team — Group 1

- Subaanky Krishnapillai – 40128716
- Andra Vele – 40175695
- Mohamed Ahmed – 40229758
- Quentin Bollore – 40348932
- Abdeljalil Sennaoui – 40117162
- Sara Rezene Habte – 40224677
