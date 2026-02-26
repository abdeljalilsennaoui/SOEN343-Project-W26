import { useState, useEffect, useRef } from 'react';
import { loadGoogleMaps, initMap, geocodeAddress, getRoute } from '../services/googleApiAdapter';
import { RENTALS, PARKING } from '../data/mockLocations';
import { searchMobilityOptions, createBookingDraft } from '../services/api';

const MONTREAL = { lat: 45.5017, lng: -73.5673 };

const MARKER_ICONS = {
  BIKE_SHARING: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  SCOOTER_SHARING: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
  CAR_SHARING: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  PARKING: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
};

export default function MapPage() {
  // Google Maps refs (imperative, not React state)
  const mapRef = useRef(null);
  const dirRendererRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const originRef = useRef(MONTREAL);

  // React state
  const [dataset, setDataset] = useState('RENTALS');
  const [addressInput, setAddressInput] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null); // { ok, message }
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Ref to always expose the latest mobilityOptions to window callbacks
  const mobilityOptionsRef = useRef([]);

  // ── Initialise Google Maps (runs once) ─────────────────────────────────────
  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        const map = initMap('map-container', MONTREAL, 13);
        mapRef.current = map;

        const renderer = new window.google.maps.DirectionsRenderer({ suppressMarkers: true });
        renderer.setMap(map);
        dirRendererRef.current = renderer;

        infoWindowRef.current = new window.google.maps.InfoWindow();

        setMapReady(true);
      })
      .catch((err) => setMapError(err.message));

    // Global callbacks for InfoWindow buttons (Google Maps InfoWindow content is HTML string,
    // so React event handlers can't be attached directly)
    window._mapRouteClick = async (lat, lng) => {
      try {
        const result = await getRoute(originRef.current, { lat, lng });
        dirRendererRef.current.setDirections(result.directionsResult);
        setRouteInfo({ distanceText: result.distanceText, durationText: result.durationText });
      } catch (e) {
        alert('Could not calculate route: ' + e.message);
      }
    };

    window._mapBookClick = async (rentalType, lat, lng) => {
      const option = mobilityOptionsRef.current.find((o) => o.type === rentalType);
      if (!option) {
        setBookingStatus({
          ok: false,
          message: 'No backend option matched. Make sure the backend is running.',
        });
        return;
      }
      const now = new Date();
      const startTime = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
      const endTime = new Date(now.getTime() + 65 * 60 * 1000).toISOString();
      try {
        const res = await createBookingDraft(
          option.optionId,
          startTime,
          endTime,
          { lat, lng },
        );
        setBookingStatus({
          ok: true,
          message: `Draft created — ID: ${res.data.id} · $${res.data.totalPrice.toFixed(2)} for 60 min`,
        });
      } catch (e) {
        setBookingStatus({ ok: false, message: e.message });
      }
    };

    return () => {
      delete window._mapRouteClick;
      delete window._mapBookClick;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch live optionIds from backend (for "Book this" matching) ──────────
  useEffect(() => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    const endTime = new Date(now.getTime() + 65 * 60 * 1000).toISOString();
    searchMobilityOptions({ city: 'Montreal', startTime, endTime })
      .then((res) => {
        mobilityOptionsRef.current = res.data;
      })
      .catch(() => {
        // Non-critical — "Book this" will show an error if backend is unavailable
      });
  }, []);

  // ── Place markers whenever map is ready or dataset changes ────────────────
  useEffect(() => {
    if (!mapReady) return;
    placeMarkers(dataset === 'RENTALS' ? RENTALS : PARKING);
  }, [mapReady, dataset]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Marker utilities ───────────────────────────────────────────────────────
  function clearMarkers() {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    infoWindowRef.current?.close();
  }

  function placeMarkers(locations) {
    clearMarkers();
    dirRendererRef.current?.set('directions', null);
    setRouteInfo(null);

    const isRental = dataset === 'RENTALS';

    locations.forEach((loc) => {
      const iconUrl = isRental ? MARKER_ICONS[loc.type] : MARKER_ICONS.PARKING;

      const marker = new window.google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: mapRef.current,
        title: loc.name,
        icon: iconUrl,
      });

      marker.addListener('click', () => {
        const content = isRental
          ? `<div style="font-family:sans-serif;min-width:210px;padding:4px">
               <div style="font-weight:600;margin-bottom:4px">${loc.name}</div>
               <div style="color:#555;font-size:13px">${loc.type.replace(/_/g, ' ')} · $${loc.pricePerMinute}/min</div>
               <div style="color:#888;font-size:12px;margin-bottom:10px">${loc.availabilityNote}</div>
               <div style="display:flex;gap:8px">
                 <button
                   onclick="window._mapRouteClick(${loc.lat},${loc.lng})"
                   style="flex:1;padding:5px 0;background:#1e40af;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px"
                 >Route</button>
                 <button
                   onclick="window._mapBookClick('${loc.type}',${loc.lat},${loc.lng})"
                   style="flex:1;padding:5px 0;background:#15803d;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px"
                 >Book this</button>
               </div>
             </div>`
          : `<div style="font-family:sans-serif;min-width:210px;padding:4px">
               <div style="font-weight:600;margin-bottom:4px">${loc.name}</div>
               <div style="color:#555;font-size:12px;margin-bottom:10px">${loc.notes}</div>
               <button
                 onclick="window._mapRouteClick(${loc.lat},${loc.lng})"
                 style="width:100%;padding:5px 0;background:#1e40af;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px"
               >Route</button>
             </div>`;

        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }

  // ── Event handlers ─────────────────────────────────────────────────────────
  async function onSearchAddress() {
    const addr = addressInput.trim();
    if (!addr) return;
    try {
      const latLng = await geocodeAddress(addr);
      originRef.current = latLng;
      mapRef.current.setCenter(latLng);
      mapRef.current.setZoom(15);
    } catch {
      alert('Address not found. Try a more specific address in Montreal.');
    }
  }

  function onUseMyLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        originRef.current = latLng;
        mapRef.current.setCenter(latLng);
        mapRef.current.setZoom(15);
      },
      () => alert('Could not get your location.'),
    );
  }

  function onClearRoute() {
    dirRendererRef.current?.set('directions', null);
    setRouteInfo(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (mapError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600 text-sm px-4">
        {mapError}
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>
      {/* Control bar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-white shadow-sm z-10 border-b border-gray-200">
        <input
          type="text"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearchAddress()}
          placeholder="Search address in Montreal..."
          className="flex-1 min-w-48 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={onSearchAddress}
          className="px-3 py-1.5 bg-blue-700 text-white rounded text-sm hover:bg-blue-800"
        >
          Search
        </button>
        <button
          onClick={onUseMyLocation}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
        >
          My location
        </button>

        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setDataset('RENTALS')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              dataset === 'RENTALS'
                ? 'bg-blue-700 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Rentals
          </button>
          <button
            onClick={() => setDataset('PARKING')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              dataset === 'PARKING'
                ? 'bg-blue-700 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Parking
          </button>
        </div>
      </div>

      {/* Booking status banner */}
      {bookingStatus && (
        <div
          className={`flex items-center justify-between px-4 py-2 text-sm border-b ${
            bookingStatus.ok
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{bookingStatus.message}</span>
          <button
            onClick={() => setBookingStatus(null)}
            className="ml-4 text-xs underline opacity-70 hover:opacity-100"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Legend */}
      {dataset === 'RENTALS' && (
        <div className="flex gap-4 px-4 py-1 bg-gray-50 border-b border-gray-100 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600" /> Bike
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-600" /> Scooter
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-red-600" /> Car
          </span>
        </div>
      )}

      {/* Map */}
      <div id="map-container" className="flex-1" />

      {/* Route info panel */}
      {routeInfo && (
        <div className="flex items-center gap-6 px-4 py-2 bg-white border-t border-gray-200 text-sm">
          <span>
            ETA: <strong>{routeInfo.durationText}</strong>
          </span>
          <span>
            Distance: <strong>{routeInfo.distanceText}</strong>
          </span>
          <button
            onClick={onClearRoute}
            className="ml-auto text-xs text-gray-400 hover:text-gray-700"
          >
            clear route
          </button>
        </div>
      )}
    </div>
  );
}
