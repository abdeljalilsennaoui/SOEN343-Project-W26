# Developer Setup Guide

Follow these steps after cloning the repo. You need two external services: **Firebase** and **Google Maps**. The team lead will share the credentials with you directly (Slack / Discord / email).

---

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- Access to the team Firebase project *(ask the team lead)*
- A Google Maps API key *(ask the team lead, or create your own — free tier is enough)*

---

## 1. Clone and install dependencies

```bash
git clone <repo-url>
cd SOEN343-Project-W26

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

---

## 2. Backend — Firebase service account

The backend uses the Firebase Admin SDK to verify user tokens. You need a service account key JSON file.

**Steps:**

1. Ask the team lead for the `serviceAccountKey.json` file, OR generate your own:
   - Go to [Firebase Console](https://console.firebase.google.com) → your project
   - Project Settings → Service Accounts → **Generate new private key**
   - Download the JSON and save it as `backend/serviceAccountKey.json`

2. Create `backend/.env` (copy the template below):

```
PORT=3001
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
AUTO_REGISTER_USERS=true
```

> `serviceAccountKey.json` and `.env` are gitignored — never commit them.

---

## 3. Frontend — environment variables

The frontend needs Firebase client config and a Google Maps API key.

**Steps:**

1. Copy the example file:

```bash
cp frontend/.env.example frontend/.env.local
```

2. Open `frontend/.env.local` and fill in the values:

```
VITE_GOOGLE_MAPS_API_KEY=<your-key>

VITE_FIREBASE_API_KEY=<from-firebase-console>
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_STORAGE_BUCKET=<project-id>.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<number>
VITE_FIREBASE_APP_ID=<app-id>
```

### Where to get the Firebase values

1. Go to [Firebase Console](https://console.firebase.google.com) → your project
2. Project Settings (gear icon) → **Your apps** section
3. Click the web app (`</>`) → you'll see a `firebaseConfig` object with all the values

### Where to get the Google Maps key

**Option A — ask the team lead** to share the existing project key (fastest).

**Option B — create your own:**

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Click **Create credentials** → API key
3. Enable these three APIs in the same project:
   - **Maps JavaScript API**
   - **Directions API**
   - **Geocoding API**
4. Restrict the key (optional but recommended):
   - Application restrictions: HTTP referrers → `http://localhost:*/*`
   - API restrictions: limit to the 3 APIs above

---

## 4. Seed Firestore data (run once)

This populates vehicles, mobility options, and parking spots. Skip if the database is already seeded (ask the team lead).

```bash
cd backend && node src/scripts/seed.js
```

Expected output:
```
Starting seed...
vehicles: seeded 27 documents.
mobilityOptions: seeded 27 documents.
parking: seeded 6 facilities, 30 spots.
Seed complete.
```

---

## 5. Start the servers

Open two terminals:

```bash
# Terminal 1 — backend
cd backend && npm run dev
# → http://localhost:3001

# Terminal 2 — frontend
cd frontend && npm run dev
# → http://localhost:5173
```

---

## 6. Verify the setup

| Check | Expected |
|---|---|
| `http://localhost:3001/api/health` | `{ "status": "ok" }` |
| `http://localhost:5173/login` | Login page renders |
| Register a new account | Redirected to home page |
| Navigate to `/map` | Map loads centred on Montreal |
| Click a Rentals marker | InfoWindow shows name + price |

---

## Troubleshooting

**`FIREBASE_SERVICE_ACCOUNT_PATH is not set`**
→ Make sure `backend/.env` exists with the correct path to your JSON key.

**`Failed to load Google Maps`**
→ Check that `VITE_GOOGLE_MAPS_API_KEY` is set in `frontend/.env.local` and the 3 APIs are enabled.

**`EADDRINUSE: port 3001 already in use`**
→ Kill the process using that port:
```bash
lsof -ti :3001 | xargs kill -9
```

**Backend returns 401 on booking routes**
→ Make sure you are logged in — booking endpoints require a valid Firebase token.

**Firestore reads return empty**
→ Run the seed script: `cd backend && node src/scripts/seed.js`
