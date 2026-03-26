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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry,places`;
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

/**
 * Converts coordinates to a readable address label.
 *
 * @param {{ lat: number, lng: number }} latLng
 * @returns {Promise<string>}
 */
export async function reverseGeocodeCoordinates(latLng) {
  const geocoder = new window.google.maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results?.length) {
        resolve(results[0].formatted_address);
        return;
      }

      resolve(`${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)}`);
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
 * @param {{ travelMode?: 'DRIVING'|'TRANSIT'|'WALKING'|'BICYCLING' }} [options]
 * @returns {Promise<{ distanceText: string, durationText: string, directionsResult: google.maps.DirectionsResult, steps: Array }>} 
 */
export async function getRoute(origin, destination, options = {}) {
  const service = new window.google.maps.DirectionsService();
  const travelMode = options.travelMode || 'DRIVING';

  return new Promise((resolve, reject) => {
    const request = {
      origin,
      destination,
      travelMode: window.google.maps.TravelMode[travelMode],
    };

    if (travelMode === 'TRANSIT') {
      request.transitOptions = {
        modes: [
          window.google.maps.TransitMode.BUS,
          window.google.maps.TransitMode.SUBWAY,
          window.google.maps.TransitMode.TRAM,
          window.google.maps.TransitMode.RAIL,
        ],
      };
    }

    service.route(
      request,
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
          steps: leg.steps ?? [],
        });
      },
    );
  });
}

export async function getNearbyTransitStations(map, center, radius = 1500) {
  const service = new window.google.maps.places.PlacesService(map);

  return new Promise((resolve, reject) => {
    const allStops = [];

    const pushStops = (results = []) => {
      const mapped = results
        .map((place) => {
          const lat = place.geometry?.location?.lat?.();
          const lng = place.geometry?.location?.lng?.();
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

          const types = Array.isArray(place.types) ? place.types : [];
          const transitType = types.includes('subway_station')
            ? 'TRANSIT_METRO'
            : types.includes('bus_station')
              ? 'TRANSIT_BUS'
              : 'TRANSIT_STATION';

          return {
            id: place.place_id,
            name: place.name || 'Transit stop',
            lat,
            lng,
            type: transitType,
            notes: place.vicinity || 'Google Transit station',
          };
        })
        .filter(Boolean);

      allStops.push(...mapped);
    };

    let pageCount = 0;
    const maxPages = 3;

    const request = {
      location: center,
      radius,
      type: 'transit_station',
    };

    const callback = (results, status, pagination) => {
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !Array.isArray(results)) {
        if (allStops.length) {
          const unique = Array.from(new Map(allStops.map((stop) => [stop.id, stop])).values());
          resolve(unique);
          return;
        }
        reject(new Error(`Transit places request failed: ${status}`));
        return;
      }

      pushStops(results);
      pageCount += 1;

      if (pagination?.hasNextPage && pageCount < maxPages) {
        setTimeout(() => pagination.nextPage(), 1200);
        return;
      }

      const unique = Array.from(new Map(allStops.map((stop) => [stop.id, stop])).values());
      resolve(unique);
    };

    service.nearbySearch(request, callback);
  });
}
