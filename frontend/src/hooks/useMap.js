import { useCallback, useEffect, useRef, useState } from 'react';
import { PARKING, RENTALS } from '../data/mockLocations';
import { createBookingDraft, searchMobilityOptions } from '../services/api';
import { geocodeAddress, getRoute, initMap, loadGoogleMaps } from '../services/googleApiAdapter';
import { MAP_THEME, MONTREAL, TYPE_META } from '../components/map/mapConfig';

const MAP_CONTAINER_ID = 'map-container';

function getLocationByCoords(lat, lng) {
  return [...RENTALS, ...PARKING].find((location) => location.lat === lat && location.lng === lng) ?? null;
}

function createMarkerIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="54" viewBox="0 0 44 54" fill="none">
      <path d="M22 2C13.1634 2 6 9.14107 6 17.95C6 30.65 22 52 22 52C22 52 38 30.65 38 17.95C38 9.14107 30.8366 2 22 2Z" fill="${color}"/>
      <path d="M22 2C13.1634 2 6 9.14107 6 17.95C6 30.65 22 52 22 52C22 52 38 30.65 38 17.95C38 9.14107 30.8366 2 22 2Z" stroke="white" stroke-width="2.5"/>
      <circle cx="22" cy="18" r="6.5" fill="white" fill-opacity="0.95"/>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(40, 48),
    anchor: new window.google.maps.Point(20, 44),
  };
}

function buildInfoWindowContent(location, isRental) {
  const meta = TYPE_META[location.type] ?? TYPE_META.PARKING;

  return isRental
    ? `<div style="font-family:Inter,Arial,sans-serif;min-width:248px;padding:4px">
         <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;color:#334155;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">${meta.label}</div>
         <div style="margin-top:12px;font-size:16px;font-weight:700;color:#0f172a">${location.name}</div>
         <div style="margin-top:6px;color:#475569;font-size:13px">$${location.pricePerMinute.toFixed(2)}/min · ${location.availabilityNote}</div>
         <div style="display:flex;gap:8px;margin-top:14px">
           <button onclick="window._mapRouteClick(${location.lat},${location.lng})" style="flex:1;padding:10px 0;background:#0f172a;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Route</button>
           <button onclick="window._mapBookClick('${location.type}',${location.lat},${location.lng})" style="flex:1;padding:10px 0;background:#10b981;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Book</button>
         </div>
       </div>`
    : `<div style="font-family:Inter,Arial,sans-serif;min-width:248px;padding:4px">
         <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:#fff7ed;border:1px solid #fed7aa;color:#b45309;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">Parking</div>
         <div style="margin-top:12px;font-size:16px;font-weight:700;color:#0f172a">${location.name}</div>
         <div style="margin-top:6px;color:#475569;font-size:13px;line-height:1.5">${location.notes}</div>
         <button onclick="window._mapRouteClick(${location.lat},${location.lng})" style="margin-top:14px;width:100%;padding:10px 0;background:#0f172a;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Get route</button>
       </div>`;
}

export function useMap() {
  const mapRef = useRef(null);
  const dirRendererRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const originRef = useRef(MONTREAL);
  const originMarkerRef = useRef(null);
  const mobilityOptionsRef = useRef([]);

  const [dataset, setDataset] = useState('RENTALS');
  const [addressInput, setAddressInput] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [originLabel, setOriginLabel] = useState('Downtown Montreal hub');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [isHeroCollapsed, setIsHeroCollapsed] = useState(false);

  const activeLocations = dataset === 'RENTALS' ? RENTALS : PARKING;

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    infoWindowRef.current?.close();
  }, []);

  const setOriginMarker = useCallback((latLng) => {
    if (!mapRef.current || !window.google?.maps) return;

    const icon = {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: '#0f172a',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 8,
    };

    if (originMarkerRef.current) {
      originMarkerRef.current.setPosition(latLng);
      return;
    }

    originMarkerRef.current = new window.google.maps.Marker({
      position: latLng,
      map: mapRef.current,
      title: 'Starting point',
      icon,
      zIndex: 1000,
    });
  }, []);

  const focusOrigin = useCallback((latLng, label) => {
    originRef.current = latLng;
    setOriginLabel(label);
    setOriginMarker(latLng);
    mapRef.current?.setCenter(latLng);
    mapRef.current?.setZoom(15);
  }, [setOriginMarker]);

  const handleRouteToLocation = useCallback(async (location) => {
    try {
      const result = await getRoute(originRef.current, { lat: location.lat, lng: location.lng });
      dirRendererRef.current?.setDirections(result.directionsResult);
      setRouteInfo({
        distanceText: result.distanceText,
        durationText: result.durationText,
        destinationName: location.name,
      });
      setSelectedLocation(location);
    } catch (error) {
      alert('Could not calculate route: ' + error.message);
    }
  }, []);

  const handleBooking = useCallback(async (location) => {
    const option = mobilityOptionsRef.current.find((item) => item.type === location.type);
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
      const response = await createBookingDraft(option.optionId, startTime, endTime, {
        lat: location.lat,
        lng: location.lng,
      });
      setBookingStatus({
        ok: true,
        message: `Draft created — ID: ${response.data.id} · $${response.data.totalPrice.toFixed(2)} for 60 min`,
      });
    } catch (error) {
      setBookingStatus({ ok: false, message: error.message });
    }
  }, []);

  const placeMarkers = useCallback((locations) => {
    clearMarkers();
    dirRendererRef.current?.set('directions', null);
    setRouteInfo(null);

    const isRental = dataset === 'RENTALS';

    locations.forEach((location) => {
      const markerColor = isRental
        ? TYPE_META[location.type]?.markerColor ?? TYPE_META.CAR_SHARING.markerColor
        : TYPE_META.PARKING.markerColor;

      const marker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: mapRef.current,
        title: location.name,
        icon: createMarkerIcon(markerColor),
      });

      marker.addListener('click', () => {
        setSelectedLocation(location);
        infoWindowRef.current?.setContent(buildInfoWindowContent(location, isRental));
        infoWindowRef.current?.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [clearMarkers, dataset]);

  const onSearchAddress = useCallback(async () => {
    const address = addressInput.trim();
    if (!address) return;

    try {
      const latLng = await geocodeAddress(address);
      focusOrigin(latLng, address);
    } catch {
      alert('Address not found. Try a more specific address in Montreal.');
    }
  }, [addressInput, focusOrigin]);

  const onUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latLng = { lat: position.coords.latitude, lng: position.coords.longitude };
        focusOrigin(latLng, 'Your live location');
      },
      () => alert('Could not get your location.'),
    );
  }, [focusOrigin]);

  const onClearRoute = useCallback(() => {
    dirRendererRef.current?.set('directions', null);
    setRouteInfo(null);
  }, []);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        const map = initMap(MAP_CONTAINER_ID, MONTREAL, 12.8);
        map.setOptions({
          disableDefaultUI: true,
          zoomControl: true,
          keyboardShortcuts: false,
          styles: MAP_THEME,
          gestureHandling: 'greedy',
        });
        mapRef.current = map;

        const renderer = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: '#0f172a',
            strokeOpacity: 0.9,
            strokeWeight: 5,
          },
        });
        renderer.setMap(map);
        dirRendererRef.current = renderer;

        infoWindowRef.current = new window.google.maps.InfoWindow();
        setOriginMarker(MONTREAL);
        setMapReady(true);
      })
      .catch((error) => setMapError(error.message));

    window._mapRouteClick = async (lat, lng) => {
      const location = getLocationByCoords(lat, lng) ?? { lat, lng, name: 'Selected destination', type: 'PARKING' };
      await handleRouteToLocation(location);
    };

    window._mapBookClick = async (rentalType, lat, lng) => {
      const location = getLocationByCoords(lat, lng) ?? { lat, lng, type: rentalType, name: 'Selected rental' };
      await handleBooking(location);
    };

    return () => {
      delete window._mapRouteClick;
      delete window._mapBookClick;
    };
  }, [handleBooking, handleRouteToLocation, setOriginMarker]);

  useEffect(() => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    const endTime = new Date(now.getTime() + 65 * 60 * 1000).toISOString();

    searchMobilityOptions({ city: 'Montreal', startTime, endTime })
      .then((response) => {
        mobilityOptionsRef.current = response.data;
        setBackendAvailable(true);
      })
      .catch(() => {
        setBackendAvailable(false);
      });
  }, []);

  useEffect(() => {
    if (!mapReady) return;

    setSelectedLocation(null);
    placeMarkers(activeLocations);
  }, [activeLocations, mapReady, placeMarkers]);

  return {
    mapContainerId: MAP_CONTAINER_ID,
    activeLocations,
    dataset,
    setDataset,
    addressInput,
    setAddressInput,
    routeInfo,
    bookingStatus,
    setBookingStatus,
    mapReady,
    mapError,
    originLabel,
    selectedLocation,
    setSelectedLocation,
    backendAvailable,
    isHeroCollapsed,
    setIsHeroCollapsed,
    onSearchAddress,
    onUseMyLocation,
    onClearRoute,
    handleRouteToLocation,
    handleBooking,
  };
}
