import { useCallback, useEffect, useRef, useState } from 'react';
import { RENTALS } from '../data/mockLocations';
import { createBookingDraft, getVehicles, searchMobilityOptions } from '../services/api';
import { geocodeAddress, getNearbyTransitStations, getRoute, initMap, loadGoogleMaps, reverseGeocodeCoordinates } from '../services/googleApiAdapter';
import { MAP_THEME, MONTREAL, TYPE_META } from '../components/map/mapConfig';
import { searchNearbyParkings } from '../services/api';
import { buildInfoWindowContent, createMarkerIcon } from '@/hooks/useMapUi';
import haversineMeters from '@/utils/math';
import normalizeRouteSteps from '@/utils/normalizeRouteSteps';
import { DEFAULT_PARKING_RADIUS_METERS, MAP_CONTAINER_ID } from '@/utils/constants';

const RENTAL_FALLBACK_BY_TYPE = RENTALS.reduce((acc, rental) => {
  if (!acc[rental.type]) acc[rental.type] = [];
  acc[rental.type].push(rental);
  return acc;
}, {});

function mapVehiclesToRentalLocations(vehicles = []) {
  const typeIndex = {};

  return vehicles
    .map((vehicle, index) => {
      const type = vehicle.type;
      const fallbackPool = RENTAL_FALLBACK_BY_TYPE[type] ?? RENTALS;
      const slot = typeIndex[type] ?? 0;
      typeIndex[type] = slot + 1;
      const fallback = fallbackPool[slot % fallbackPool.length] ?? RENTALS[index % RENTALS.length];

      const lat = Number(vehicle.lat ?? fallback?.lat);
      const lng = Number(vehicle.lng ?? fallback?.lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      return {
        id: vehicle.id ?? `vehicle-${index}`,
        name: vehicle.name ?? `${TYPE_META[type]?.label ?? 'Rental'} — ${vehicle.city ?? 'Montreal'}`,
        type,
        lat,
        lng,
        pricePerMinute: Number(vehicle.pricePerMin ?? vehicle.pricePerMinute ?? fallback?.pricePerMinute ?? 0),
        availabilityNote: vehicle.status ? `Status: ${vehicle.status}` : (fallback?.availabilityNote ?? 'Available now'),
      };
    })
    .filter(Boolean);
}

export function useMap() {
  const mapRef = useRef(null);
  const dirRendererRef = useRef(null);
  const transitLayerRef = useRef(null);
  const markersRef = useRef([]);
  const transitClickMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const originRef = useRef(MONTREAL);
  const destinationRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const mobilityOptionsRef = useRef([]);
  const transitStopsRef = useRef([]);
  const rentalsRef = useRef(RENTALS);
  const parkingSpotsRef = useRef([]);
  const parkingCacheRef = useRef(new Map());
  const parkingLoadingRef = useRef(false);

  const [dataset, setDataset] = useState('RENTALS');
  const [addressInput, setAddressInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [originLabel, setOriginLabel] = useState('Downtown Montreal hub');
  const [destinationLabel, setDestinationLabel] = useState('Click map to set destination');
  const [mapClickMode, setMapClickMode] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [isHeroCollapsed, setIsHeroCollapsed] = useState(false);
  const [rentals, setRentals] = useState(RENTALS);
  const [transitStops, setTransitStops] = useState([]);
  const [parkingSpots, setParkingSpots] = useState([]);
  const [parkingRadiusMeters, setParkingRadiusMeters] = useState(DEFAULT_PARKING_RADIUS_METERS);

  const activeLocations = dataset === 'RENTALS' ? rentals : dataset === 'TRANSIT' ? transitStops : parkingSpots;


  const getLocationByCoords = useCallback((lat, lng) => {
    return [...rentalsRef.current, ...parkingSpotsRef.current, ...transitStopsRef.current]
      .find((location) => location.lat === lat && location.lng === lng) ?? null;
  }, []);

  const loadRentalVehicles = useCallback(async () => {
    try {
      const response = await getVehicles({ city: 'Montreal' });
      const backendVehicles = Array.isArray(response?.data) ? response.data : [];
      const mappedVehicles = mapVehiclesToRentalLocations(backendVehicles);

      if (mappedVehicles.length > 0) {
        rentalsRef.current = mappedVehicles;
        setRentals(mappedVehicles);
        return;
      }
    } catch {
      //
    }

    rentalsRef.current = RENTALS;
    setRentals(RENTALS);
  }, []);

  const loadTransitStops = useCallback(async (latLng = originRef.current, radius = 3500) => {
    if (!mapRef.current || !window.google?.maps?.places) return;

    try {
      const stops = await getNearbyTransitStations(mapRef.current, latLng, radius);

      transitStopsRef.current = stops;
      setTransitStops(stops);
    } catch {
      transitStopsRef.current = [];
      setTransitStops([]);
    }
  }, []);

  const getTransitRadiusFromViewport = useCallback(() => {
    if (!mapRef.current) return 3500;

    const bounds = mapRef.current.getBounds();
    if (!bounds) return 3500;

    const center = bounds.getCenter();
    const northEast = bounds.getNorthEast();
    const radius = Math.ceil(haversineMeters(center.lat(), center.lng(), northEast.lat(), northEast.lng()));

    return Math.min(Math.max(radius, 2500), 12000);
  }, []);

  const loadParkingSpots = useCallback(async (latLng = originRef.current, options = {}) => {
    if (parkingLoadingRef.current && !options.force) return;

    const cacheKey = `${Number(latLng.lat).toFixed(3)}:${Number(latLng.lng).toFixed(3)}`;

    if (!options.force && parkingCacheRef.current?.key === cacheKey) {
      setParkingSpots(parkingCacheRef.current.data);
      parkingSpotsRef.current = parkingCacheRef.current.data;
      return;
    }

    parkingLoadingRef.current = true;
    try {
      const spots = await searchNearbyParkings(latLng, DEFAULT_PARKING_RADIUS_METERS);
      parkingCacheRef.current = { key: cacheKey, data: spots };
      parkingSpotsRef.current = spots;
      setParkingSpots(spots);
    } catch {
      parkingSpotsRef.current = [];
      setParkingSpots([]);
    } finally {
      parkingLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!mapReady || dataset !== 'PARKING') return;
    loadParkingSpots(originRef.current);
  }, [mapReady, dataset, loadParkingSpots]);

  useEffect(() => {
    if (!mapReady || dataset !== 'RENTALS') return;
    loadRentalVehicles();
  }, [dataset, loadRentalVehicles, mapReady]);


  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    transitClickMarkersRef.current.forEach((marker) => marker.setMap(null));
    transitClickMarkersRef.current = [];
    infoWindowRef.current?.close();
  }, []);

  const setOriginMarker = useCallback((latLng) => {
    if (!mapRef.current || !window.google?.maps) return;

    const icon = {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: '#e5e7eb',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 14,
    };

    const originLabel = {
      text: 'A',
      color: '#000000',
      fontWeight: '700',
      fontSize: '12px',
      fontFamily: 'Space Mono',
    };

    if (originMarkerRef.current) {
      originMarkerRef.current.setMap(null);
      originMarkerRef.current = null;
    }

    originMarkerRef.current = new window.google.maps.Marker({
      map: mapRef.current,
      position: latLng,
      title: 'Starting point',
      icon,
      label: originLabel,
      optimized: false,
      zIndex: 1000,
    });
  }, []);

  const setDestinationMarker = useCallback((latLng) => {
    if (!mapRef.current || !window.google?.maps) return;

    const icon = {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: '#9ca3af',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 14,
    };

    const destinationLabel = {
      text: 'B',
      color: '#000000',
      fontWeight: '700',
      fontSize: '12px',
      fontFamily: 'Space Mono',
    };

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
      destinationMarkerRef.current = null;
    }

    destinationMarkerRef.current = new window.google.maps.Marker({
      map: mapRef.current,
      position: latLng,
      title: 'Destination point',
      icon,
      label: destinationLabel,
      optimized: false,
      zIndex: 1000,
    });
  }, []);

  const focusOrigin = useCallback((latLng, label) => {
    originRef.current = latLng;
    setOriginLabel(label);
    setOriginMarker(latLng);
    mapRef.current?.setCenter(latLng);
    mapRef.current?.setZoom(15);
    loadTransitStops(latLng, 3500);
  }, [loadTransitStops, setOriginMarker]);

  const handleRouteToLocation = useCallback(async (location) => {
    try {
      destinationRef.current = { lat: location.lat, lng: location.lng };
      setDestinationMarker(destinationRef.current);
      setDestinationLabel(location.name || 'Selected destination');

      const travelMode = location.type?.startsWith('TRANSIT_') ? 'TRANSIT' : 'DRIVING';
      const result = await getRoute(originRef.current, { lat: location.lat, lng: location.lng }, { travelMode });
      dirRendererRef.current?.setDirections(result.directionsResult);
      setRouteInfo({
        distanceText: result.distanceText,
        durationText: result.durationText,
        destinationName: location.name,
        travelMode,
        steps: normalizeRouteSteps(result.steps),
      });
      setSelectedLocation(location);
    } catch (error) {
      alert('Could not calculate route: ' + error.message);
    }
  }, [setDestinationMarker]);

  const calculateTransitRoute = useCallback(async (destinationLatLng, destinationName = 'Selected destination') => {
    try {
      destinationRef.current = destinationLatLng;
      setDestinationMarker(destinationLatLng);
      setDestinationLabel(destinationName);

      const result = await getRoute(originRef.current, destinationLatLng, { travelMode: 'TRANSIT' });
      dirRendererRef.current?.setDirections(result.directionsResult);
      setRouteInfo({
        distanceText: result.distanceText,
        durationText: result.durationText,
        destinationName,
        travelMode: 'TRANSIT',
        steps: normalizeRouteSteps(result.steps),
      });
      setSelectedLocation({ ...destinationLatLng, name: destinationName, type: 'TRANSIT_STATION' });
    } catch (error) {
      alert(`Could not calculate transit route: ${error.message}`);
    }
  }, [setDestinationMarker]);

  const handleBooking = useCallback(async (location) => {
    if (location.type === 'PARKING' || location.type.startsWith('TRANSIT_')) {
      setBookingStatus({ ok: false, message: 'Transit and parking are route-only in map mode.' });
      return;
    }

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

    if (dataset === 'TRANSIT') {
      locations.forEach((location) => {
        const transitClickMarker = new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: mapRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 16,
            fillOpacity: 0,
            strokeOpacity: 0,
          },
          clickable: true,
          zIndex: 9999,
        });

        transitClickMarker.addListener('click', async () => {
          setSelectedLocation(location);
          infoWindowRef.current?.setContent(buildInfoWindowContent(location, 'TRANSIT'));
          infoWindowRef.current?.open(mapRef.current, transitClickMarker);
        });

        transitClickMarkersRef.current.push(transitClickMarker);
      });

      return;
    }

    locations.forEach((location) => {
      if (location.type === 'TRANSIT_METRO' || location.type === 'TRANSIT_BUS' || location.type === 'TRANSIT_STATION') {
        return;
      }

      const markerColor = TYPE_META[location.type]?.markerColor ?? TYPE_META.PARKING.markerColor;

      const markerOptions = {
        position: { lat: location.lat, lng: location.lng },
        map: mapRef.current,
        title: location.type === "PARKING" ? location.facilityName : location.name,
      };

      if (location.type === 'PARKING') {
        markerOptions.icon = {
          path: 'M -6,-10 L 6,-10 L 6,10 L -6,10 Z',
          fillColor: '#9ca3af',
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 1.5,
          scale: 1.2,
        };
        markerOptions.label = {
          text: 'P',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 'bold',
          fontFamily: 'Space Mono',
        };
        markerOptions.zIndex = 10;
      } else {
        markerOptions.icon = createMarkerIcon(markerColor);
      }

      const marker = new window.google.maps.Marker(markerOptions);

      marker.addListener('click', () => {
        setSelectedLocation(location);
        infoWindowRef.current?.setContent(buildInfoWindowContent(location, dataset));
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
        setAddressInput('my location');
        focusOrigin(latLng, 'Your live location');
      },
      () => alert('Could not get your location.'),
    );
  }, [focusOrigin]);

  const onClearRoute = useCallback(() => {
    dirRendererRef.current?.set('directions', null);
    setRouteInfo(null);
    destinationRef.current = null;
    setDestinationLabel('Click map to set destination');
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
      destinationMarkerRef.current = null;
    }
  }, []);

  const onStartMapPick = useCallback((mode) => {
    setMapClickMode(mode);
  }, []);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        const map = initMap(MAP_CONTAINER_ID, MONTREAL, 12.8);
        map.setOptions({
          disableDefaultUI: true,
          zoomControl: false,
          keyboardShortcuts: false,
          styles: MAP_THEME,
          gestureHandling: 'greedy',
        });
        mapRef.current = map;

        transitLayerRef.current = new window.google.maps.TransitLayer();

        const renderer = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: '#f3f4f6',
            strokeOpacity: 0.92,
            strokeWeight: 4,
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
  }, [getLocationByCoords, handleBooking, handleRouteToLocation, setOriginMarker]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const listener = mapRef.current.addListener('click', async (event) => {
      if (!mapClickMode) return;

      const latLng = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      const label = await reverseGeocodeCoordinates(latLng);

      if (mapClickMode === 'origin') {
        focusOrigin(latLng, label);
        setAddressInput(label);
        setMapClickMode('destination');
        return;
      }

      destinationRef.current = latLng;
      setDestinationMarker(latLng);
      setDestinationLabel(label);
      setDestinationInput(label);
      setMapClickMode(null);
      await calculateTransitRoute(latLng, label);
    });

    return () => {
      if (listener) window.google.maps.event.removeListener(listener);
    };
  }, [calculateTransitRoute, focusOrigin, mapClickMode, mapReady, setDestinationMarker]);

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
    loadTransitStops(MONTREAL, getTransitRadiusFromViewport());
  }, [getTransitRadiusFromViewport, loadTransitStops, mapReady]);

  useEffect(() => {
    if (!mapReady || dataset !== 'TRANSIT' || !mapRef.current) return;

    const listener = mapRef.current.addListener('idle', () => {
      const center = mapRef.current?.getCenter();
      if (!center) return;

      loadTransitStops(
        { lat: center.lat(), lng: center.lng() },
        getTransitRadiusFromViewport(),
      );
    });

    return () => {
      if (listener) window.google.maps.event.removeListener(listener);
    };
  }, [dataset, getTransitRadiusFromViewport, loadTransitStops, mapReady]);

  useEffect(() => {
    if (!mapReady) return;

    if (dataset === 'TRANSIT') {
      transitLayerRef.current?.setMap(mapRef.current);
    } else {
      transitLayerRef.current?.setMap(null);
    }

    setSelectedLocation(null);
    placeMarkers(activeLocations);
  }, [activeLocations, dataset, mapReady, placeMarkers]);

  return {
    mapContainerId: MAP_CONTAINER_ID,
    activeLocations,
    dataset,
    setDataset,
    addressInput,
    setAddressInput,
    destinationInput,
    setDestinationInput,
    routeInfo,
    bookingStatus,
    setBookingStatus,
    mapReady,
    mapError,
    originLabel,
    destinationLabel,
    mapClickMode,
    selectedLocation,
    setSelectedLocation,
    backendAvailable,
    transitStops,
    parkingSpots,
    parkingRadiusMeters,
    setParkingRadiusMeters,
    refreshParkingSpots: () => loadParkingSpots(originRef.current, parkingRadiusMeters, { force: true }),
    isHeroCollapsed,
    setIsHeroCollapsed,
    onSearchAddress,
    onUseMyLocation,
    onClearRoute,
    onStartMapPick,
    calculateTransitRoute,
    handleRouteToLocation,
    handleBooking,
  };
}
