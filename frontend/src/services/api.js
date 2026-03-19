import { auth } from '../lib/firebase';

const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || 'Something went wrong');
    error.code = data.error?.code || 'UNKNOWN_ERROR';
    error.status = response.status;
    throw error;
  }

  return data;
}

// ── User ─────────────────────────────────────────────────────────────────────

export function registerUser(role) {
  return request('/users/register', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export function getMyProfile() {
  return request('/users/me');
}

// ── Vehicles ─────────────────────────────────────────────────────────────────

export function getVehicles(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/vehicles?${query}` : '/vehicles';
  return request(endpoint);
}

// ── Legacy reservation flow ───────────────────────────────────────────────────

export function createReservation(userId, vehicleId) {
  return request('/reservations', {
    method: 'POST',
    body: JSON.stringify({ userId, vehicleId }),
  });
}

export function chargePayment(reservationId, amount) {
  return request('/payments/charge', {
    method: 'POST',
    body: JSON.stringify({ reservationId, amount }),
  });
}

export function returnVehicle(reservationId) {
  return request('/returns', {
    method: 'POST',
    body: JSON.stringify({ reservationId }),
  });
}

// ── Booking workflow (draft → confirm → complete) ─────────────────────────────

export function searchMobilityOptions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/mobility/options/search?${query}`);
}

export function createBookingDraft(optionId, startTime, endTime, pickupLocation) {
  return request('/bookings/draft', {
    method: 'POST',
    body: JSON.stringify({ optionId, startTime, endTime, pickupLocation }),
  });
}

export function confirmBooking(draftId, token) {
  return request(`/bookings/${draftId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ paymentDetails: { token } }),
  });
}

export function completeBooking(bookingId) {
  return request(`/bookings/${bookingId}/complete`, {
    method: 'POST',
  });
}

export function getMyBookings() {
  return request('/bookings');
}

// ── Provider vehicle management ───────────────────────────────────────────────

export function getProviderVehicles() {
  return request('/provider/vehicles');
}

export function addProviderVehicle(data) {
  return request('/provider/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProviderVehicle(vehicleId, data) {
  return request(`/provider/vehicles/${vehicleId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deactivateProviderVehicle(vehicleId) {
  return request(`/provider/vehicles/${vehicleId}`, { method: 'DELETE' });
}

// ── Parking ───────────────────────────────────────────────────────────────────

export function getParkingFacilities(city) {
  const query = city ? `?city=${encodeURIComponent(city)}` : '';
  return request(`/parking/facilities${query}`);
}

export function getAvailableSpots(city) {
  const query = city ? `?city=${encodeURIComponent(city)}` : '';
  return request(`/parking/spots/available${query}`);
}

export function reserveParkingSpot(spotId) {
  return request('/parking/spots/reserve', {
    method: 'POST',
    body: JSON.stringify({ spotId }),
  });
}

export function releaseParkingSpot(spotId) {
  return request('/parking/spots/release', {
    method: 'POST',
    body: JSON.stringify({ spotId }),
  });
}

// ── Transit ───────────────────────────────────────────────────────────────────

export function getTransitSchedule(city, line = null) {
  const params = new URLSearchParams({ city });
  if (line) params.set('line', line);
  return request(`/transit/schedule?${params.toString()}`);
}

export function getNearbyStops(lat, lng) {
  return request(`/transit/stops/nearby?lat=${lat}&lng=${lng}`);
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function getRentalAnalytics() {
  return request('/analytics/rentals');
}

export function getGatewayAnalytics() {
  return request('/analytics/gateway');
}
