const { v4: uuidv4 } = require('uuid');

/**
 * Analytics Model — data, storage, and business logic (MVC pattern)
 *
 * @typedef {Object} AnalyticsEvent
 * @property {string} id
 * @property {string} type
 * @property {string} city
 * @property {string} createdAt - ISO date string
 * @property {Object} [metadata]
 */

// In-memory storage
const events = [];

// Data access & business logic
function trackEvent(type, city, metadata = null) {
  const event = {
    id: uuidv4(),
    type,
    city,
    createdAt: new Date().toISOString(),
    metadata,
  };
  events.push(event);
  return event;
}

function findByCity(city) {
  return events.filter((e) => e.city.toLowerCase() === city.toLowerCase());
}

function findByType(type) {
  return events.filter((e) => e.type === type);
}

function findAll() {
  return [...events];
}

function getRentalAnalytics() {
  const rentalEvents = events.filter((e) => e.type === 'RESERVATION_CREATED');
  
  const totalRentals = rentalEvents.length;
  const rentalsByCity = {};
  const rentalsByType = {};
  
  for (const event of rentalEvents) {
    const city = event.city || 'unknown';
    const type = event.metadata?.vehicleType || 'unknown';
    
    rentalsByCity[city] = (rentalsByCity[city] || 0) + 1;
    rentalsByType[type] = (rentalsByType[type] || 0) + 1;
  }
  
  return {
    totalRentals,
    rentalsByCity,
    rentalsByType
  };
}

module.exports = {
  trackEvent,
  findByCity,
  findByType,
  findAll,
  getRentalAnalytics,
};
