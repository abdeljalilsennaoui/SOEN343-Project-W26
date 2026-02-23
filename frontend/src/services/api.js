const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const config = {
    headers: { 'Content-Type': 'application/json' },
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

export function getVehicles(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/vehicles?${query}` : '/vehicles';
  return request(endpoint);
}

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

export function getRentalAnalytics() {
  return request('/analytics/rentals');
}