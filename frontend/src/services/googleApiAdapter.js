/**
 * Google Maps API Adapter
 *
 * All google.maps.* calls are confined to this module.
 * Pages and components import only the functions below — never window.google directly.
 *
 * Key is read from import.meta.env.VITE_GOOGLE_MAPS_API_KEY (set in frontend/.env.local).
 */

// ─── Script loader ────────────────────────────────────────────────────────────

let _loadPromise = null;

/**
 * Dynamically injects the Maps JS API <script> tag exactly once.
 * Safe to call multiple times (returns the same promise).
 *
 * @returns {Promise<void>}
 */
export function loadGoogleMaps() {
  if (_loadPromise) return _loadPromise;

  _loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set. Add it to frontend/.env.local'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Maps JS API'));
    document.head.appendChild(script);
  });

  return _loadPromise;
}

// ─── Map initialisation ───────────────────────────────────────────────────────

/**
 * Creates a google.maps.Map instance inside the given DOM container.
 *
 * @param {string} containerId - id of the target <div>
 * @param {{ lat: number, lng: number }} center
 * @param {number} [zoom=13]
 * @returns {google.maps.Map}
 */
export function initMap(containerId, center, zoom = 13) {
  const el = document.getElementById(containerId);
  return new window.google.maps.Map(el, { center, zoom });
}

// ─── Geocoding ────────────────────────────────────────────────────────────────

/**
 * Converts an address string to a { lat, lng } object.
 * Uses google.maps.Geocoder (Maps JS API client — no server-side key exposure).
 *
 * @param {string} address
 * @returns {Promise<{ lat: number, lng: number }>}
 */
export async function geocodeAddress(address) {
  const geocoder = new window.google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status !== 'OK' || !results.length) {
        reject(new Error(`Geocode failed for "${address}": ${status}`));
        return;
      }
      const { lat, lng } = results[0].geometry.location;
      resolve({ lat: lat(), lng: lng() });
    });
  });
}

// ─── Directions ───────────────────────────────────────────────────────────────

/**
 * Fetches a route between two lat/lng points.
 * Uses google.maps.DirectionsService (Maps JS API client).
 *
 * @param {{ lat: number, lng: number }} origin
 * @param {{ lat: number, lng: number }} destination
 * @param {string} [travelMode='DRIVING']
 * @returns {Promise<{ distanceText: string, durationText: string, directionsResult: google.maps.DirectionsResult }>}
 */
export async function getRoute(origin, destination, travelMode = 'DRIVING') {
  const service = new window.google.maps.DirectionsService();

  return new Promise((resolve, reject) => {
    service.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode[travelMode],
      },
      (result, status) => {
        if (status !== 'OK') {
          reject(new Error(`Directions request failed: ${status}`));
          return;
        }
        const leg = result.routes[0].legs[0];
        resolve({
          distanceText: leg.distance.text,
          durationText: leg.duration.text,
          directionsResult: result,
        });
      },
    );
  });
}
