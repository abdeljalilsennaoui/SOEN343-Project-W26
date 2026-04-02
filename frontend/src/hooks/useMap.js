import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RENTALS } from '../data/mockLocations';
import { confirmBooking, createBookingDraft, getMyBookings, getVehicles, joinRide, leaveRide, listRideShares, searchMobilityOptions } from '../services/api';
import { auth } from '../lib/firebase';
import { geocodeAddress, getNearbyTransitStations, getRoute, initMap, loadGoogleMaps, reverseGeocodeCoordinates } from '../services/googleApiAdapter';
import { MAP_THEME, MONTREAL, TYPE_META } from '../components/map/mapConfig';
import { searchNearbyParkings } from '../services/api';
import { buildInfoWindowContent, createMarkerIcon, createRideShareMarkerIcon } from '@/hooks/useMapUi';
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
  const positionIndex = {};

  return vehicles
    .map((vehicle, index) => {
      const type = vehicle.type;
      const fallbackPool = RENTAL_FALLBACK_BY_TYPE[type] ?? RENTALS;
      const slot = typeIndex[type] ?? 0;
      typeIndex[type] = slot + 1;
      const fallback = fallbackPool[slot % fallbackPool.length] ?? RENTALS[index % RENTALS.length];

      const baseLat = Number(vehicle.lat ?? fallback?.lat);
      const baseLng = Number(vehicle.lng ?? fallback?.lng);

      if (!Number.isFinite(baseLat) || !Number.isFinite(baseLng)) return null;

      // Offset duplicate coordinates so stacked markers are all individually visible.
      // 0.005° per step (~550 m) is wide enough to appear as distinct pins at zoom 12–13.
      const posKey = `${baseLat.toFixed(4)},${baseLng.toFixed(4)}`;
      const posCount = positionIndex[posKey] ?? 0;
      positionIndex[posKey] = posCount + 1;
      const lat = baseLat + posCount * 0.005;
      const lng = baseLng + posCount * 0.005;

      return {
        id: vehicle.id ?? `vehicle-${index}`,
        name: vehicle.name ?? `${TYPE_META[type]?.label ?? 'Rental'} — ${vehicle.city ?? 'Montreal'}`,
        type,
        lat,
        lng,
        status: vehicle.status || 'AVAILABLE',
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
  const rideSharesRef = useRef([]);

  const [pendingBooking, setPendingBooking] = useState(null); // { location, option }
  const [pendingPayment, setPendingPayment] = useState(null); // { draft, rideSharing }
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
  const [rideShares, setRideShares] = useState([]);
  const [routeActive, setRouteActive] = useState(false);
  const [activeBookings, setActiveBookings] = useState([]);

  const activeLocations = useMemo(
    () => (dataset === 'RENTALS' ? [...rentals, ...rideShares] : dataset === 'TRANSIT' ? transitStops : parkingSpots),
    [dataset, rentals, rideShares, transitStops, parkingSpots],
  );


  const getLocationByCoords = useCallback((lat, lng) => {
    return [...rentalsRef.current, ...parkingSpotsRef.current, ...transitStopsRef.current]
      .find((location) => location.lat === lat && location.lng === lng) ?? null;
  }, []);

  const loadRentalVehicles = useCallback(async () => {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
      const endTime = new Date(now.getTime() + 65 * 60 * 1000).toISOString();

      const [vehicleRes, optionsRes] = await Promise.all([
        getVehicles({ city: 'Montreal' }),
        searchMobilityOptions({ city: 'Montreal', startTime, endTime }),
      ]);

      const backendVehicles = Array.isArray(vehicleRes?.data) ? vehicleRes.data : [];
      const mappedVehicles = mapVehiclesToRentalLocations(backendVehicles);

      // Refresh mobility options — used for both the InfoWindow badge and booking handler.
      if (Array.isArray(optionsRes?.data)) {
        mobilityOptionsRef.current = optionsRes.data;
        setBackendAvailable(true);
      }

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

  const loadRideShares = useCallback(async () => {
    try {
      const res = await listRideShares();
      const rides = (res.data || []).map((booking) => {
        const pickup = booking.pickupLocation;
        if (!pickup || typeof pickup !== 'object') return null;
        const lat = Number(pickup.lat);
        const lng = Number(pickup.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const seatsLeft = (booking.maxPassengers ?? 0) - (booking.passengers?.length ?? 0);
        return {
          id: booking.id,
          type: 'RIDE_SHARE',
          lat,
          lng,
          name: 'Shared Ride',
          pickupAddress: pickup.address || null,
          seatsLeft,
          maxPassengers: booking.maxPassengers ?? 0,
          passengers: booking.passengers ?? [],
          startTime: booking.startTime,
          endTime: booking.endTime,
          driverId: booking.userId,
          isDriver: booking.userId === auth.currentUser?.uid,
          isPassenger: (booking.passengers ?? []).includes(auth.currentUser?.uid),
        };
      }).filter(Boolean);
      rideSharesRef.current = rides;
      setRideShares(rides);
    } catch {
      rideSharesRef.current = [];
      setRideShares([]);
    }
  }, []);

  const joinRideOnMap = useCallback(async (bookingId) => {
    try {
      await joinRide(bookingId);
      await loadRideShares();
      setBookingStatus({ ok: true, message: 'You joined the shared ride! Head to the pickup point.' });
    } catch (err) {
      setBookingStatus({ ok: false, message: err.message || 'Failed to join ride.' });
    }
  }, [loadRideShares]);

  const leaveRideOnMap = useCallback(async (bookingId) => {
    try {
      await leaveRide(bookingId);
      await loadRideShares();
      setBookingStatus({ ok: true, message: 'You left the shared ride.' });
    } catch (err) {
      setBookingStatus({ ok: false, message: err.message || 'Failed to leave ride.' });
    }
  }, [loadRideShares]);

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

  const loadActiveBookings = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const res = await getMyBookings();
      const active = (res.data || []).filter((b) => b.status === 'DRAFT' || b.status === 'ACTIVE');
      setActiveBookings(active);
    } catch {
      setActiveBookings([]);
    }
  }, []);

  useEffect(() => {
    if (!mapReady || dataset !== 'PARKING') return;
    loadParkingSpots(originRef.current);
  }, [mapReady, dataset, loadParkingSpots]);

  useEffect(() => {
    if (!mapReady || dataset !== 'RENTALS') return;
    loadRentalVehicles();
    loadRideShares();
  }, [dataset, loadRentalVehicles, loadRideShares, mapReady]);

  // Load active bookings on mount and when focus returns
  useEffect(() => {
    if (!mapReady) return;
    loadActiveBookings();
  }, [loadActiveBookings, mapReady]);

  // Refresh data when the page regains focus — throttled to once per 30 s
  // to avoid excessive Firestore reads on repeated tab switches.
  useEffect(() => {
    if (!mapReady) return;

    const THROTTLE_MS = 30_000;
    let lastRefresh = 0;

    const refresh = () => {
      const now = Date.now();
      if (now - lastRefresh < THROTTLE_MS) return;
      lastRefresh = now;
      if (dataset === 'RENTALS') { loadRentalVehicles(); loadRideShares(); }
      if (dataset === 'PARKING') loadParkingSpots(originRef.current, { force: true });
      loadActiveBookings();
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
    };
  }, [dataset, loadParkingSpots, loadRentalVehicles, loadRideShares, loadActiveBookings, mapReady]);


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
      clearMarkers();
      setRouteActive(true);
    } catch (error) {
      alert('Could not calculate route: ' + error.message);
    }
  }, [clearMarkers, setDestinationMarker]);

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
      clearMarkers();
      setRouteActive(true);
    } catch (error) {
      alert(`Could not calculate transit route: ${error.message}`);
    }
  }, [clearMarkers, setDestinationMarker]);

  const handleBooking = useCallback(async (location) => {
    if (location.type === 'PARKING' || location.type.startsWith('TRANSIT_')) {
      setBookingStatus({ ok: false, message: 'Transit and parking are route-only in map mode.' });
      return;
    }

    // Only book the exact vehicle that was clicked — never silently redirect to another.
    const option = mobilityOptionsRef.current.find((item) => item.optionId === location.id);
    if (!option || !option.availability) {
      setBookingStatus({
        ok: false,
        message: 'This vehicle is already booked. Please select an available one.',
      });
      return;
    }

    // For CAR_SHARING, show ride-sharing modal before creating the draft.
    if (option.type === 'CAR_SHARING') {
      setPendingBooking({ location, option });
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
      await loadRentalVehicles();
      setPendingPayment({ draft: response.data, rideSharing: false });
    } catch (error) {
      setBookingStatus({ ok: false, message: error.message });
    }
  }, [loadRentalVehicles]);

  const confirmPendingBooking = useCallback(async (rideSharing, maxPassengers, pickupAddress) => {
    if (!pendingBooking) return;
    const { location, option } = pendingBooking;
    const now = new Date();
    const startTime = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    const endTime = new Date(now.getTime() + 65 * 60 * 1000).toISOString();
    const pickupLocation = (rideSharing && pickupAddress)
      ? { lat: location.lat, lng: location.lng, address: pickupAddress }
      : { lat: location.lat, lng: location.lng };
    try {
      const draftRes = await createBookingDraft(
        option.optionId,
        startTime,
        endTime,
        pickupLocation,
        rideSharing,
        rideSharing ? maxPassengers : 0,
      );
      await loadRentalVehicles();
      setPendingBooking(null);
      setPendingPayment({ draft: draftRes.data, rideSharing });
    } catch (error) {
      setPendingBooking(null);
      setBookingStatus({ ok: false, message: error.message });
    }
  }, [pendingBooking, loadRentalVehicles]);

  const confirmPayment = useCallback(async (paymentToken) => {
    if (!pendingPayment) return;
    const { draft, rideSharing } = pendingPayment;
    try {
      const confirmed = await confirmBooking(draft.id, paymentToken);
      const booking = confirmed.data.booking;
      await loadRentalVehicles();
      loadRideShares();
      loadActiveBookings();
      setPendingPayment(null);
      setBookingStatus({
        ok: true,
        message: `Booked — ID: ${booking.id.slice(0, 8)} · $${booking.totalPrice?.toFixed(2)}${rideSharing ? ' · Ride sharing on' : ''}`,
      });
    } catch (error) {
      setPendingPayment(null);
      setBookingStatus({ ok: false, message: error.message });
    }
  }, [pendingPayment, loadRentalVehicles, loadRideShares, loadActiveBookings]);

  const cancelPayment = useCallback(() => setPendingPayment(null), []);

  useEffect(() => {
    window._mapJoinClick = async (bookingId) => { await joinRideOnMap(bookingId); };
    window._mapLeaveClick = async (bookingId) => { await leaveRideOnMap(bookingId); };
    return () => {
      delete window._mapJoinClick;
      delete window._mapLeaveClick;
    };
  }, [joinRideOnMap, leaveRideOnMap]);

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

      const markerOptions = {
        position: { lat: location.lat, lng: location.lng },
        map: mapRef.current,
        opacity: 1,
      };

      if (location.type === 'RIDE_SHARE') {
        markerOptions.title = 'Shared Ride';
        markerOptions.icon = createRideShareMarkerIcon(location.seatsLeft);
        markerOptions.opacity = location.seatsLeft <= 0 ? 0.5 : 1;
        markerOptions.zIndex = 50;
      } else if (location.type === 'PARKING') {
        markerOptions.title = location.facilityName;
        const specificOption = mobilityOptionsRef.current.find((o) => o.optionId === location.id);
        const isBookedOut = specificOption ? !specificOption.availability : false;
        const isUnavailable = (location.status && location.status !== 'AVAILABLE') || isBookedOut;
        markerOptions.opacity = isUnavailable ? 0.4 : 1;
        markerOptions.icon = {
          path: 'M -6,-10 L 6,-10 L 6,10 L -6,10 Z',
          fillColor: '#8b7ea8',
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
        markerOptions.title = location.name;
        const specificOption = mobilityOptionsRef.current.find((o) => o.optionId === location.id);
        const isBookedOut = specificOption ? !specificOption.availability : false;
        const isUnavailable = (location.status && location.status !== 'AVAILABLE') || isBookedOut;
        const markerColor = isUnavailable ? '#4b5563' : (TYPE_META[location.type]?.markerColor ?? TYPE_META.PARKING.markerColor);
        markerOptions.opacity = isUnavailable ? 0.4 : 1;
        markerOptions.icon = createMarkerIcon(markerColor);
      }

      const marker = new window.google.maps.Marker(markerOptions);

      marker.addListener('click', () => {
        setSelectedLocation(location);

        if (location.type === 'RIDE_SHARE') {
          infoWindowRef.current?.setContent(buildInfoWindowContent(location, 'RIDE_SHARE'));
        } else {
          const enriched = { ...location };
          if (dataset === 'RENTALS') {
            const opts = mobilityOptionsRef.current.filter((o) => o.type === location.type);
            if (opts.length > 0) {
              const remaining = opts.reduce((s, o) => s + (o.remaining ?? 0), 0);
              const capacity = opts.reduce((s, o) => s + (o.capacity ?? 1), 0);
              enriched.remaining = remaining;
              enriched.capacity = capacity;
              enriched.availabilityNote = remaining > 0 ? `${remaining}/${capacity} available` : 'Fully booked';
            }
          }
          infoWindowRef.current?.setContent(buildInfoWindowContent(enriched, dataset));
        }
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
    setRouteActive(false);
  }, []);

  const resetMap = useCallback(() => {
    // Clear route + destination marker
    dirRendererRef.current?.set('directions', null);
    setRouteInfo(null);
    destinationRef.current = null;
    setDestinationLabel('Click map to set destination');
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
      destinationMarkerRef.current = null;
    }

    // Reset origin back to Montreal
    originRef.current = MONTREAL;
    setOriginLabel('Downtown Montreal hub');
    setOriginMarker(MONTREAL);

    // Clear inputs and UI state
    setAddressInput('');
    setDestinationInput('');
    setSelectedLocation(null);
    setMapClickMode(null);
    setDataset('RENTALS');

    // Re-center map
    mapRef.current?.setCenter(MONTREAL);
    mapRef.current?.setZoom(12.8);

    // Turn off transit layer
    transitLayerRef.current?.setMap(null);

    // Re-show markers
    setRouteActive(false);
  }, [setOriginMarker]);

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
      if (event.placeId) {
        event.stop();
      }

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

  // mobilityOptionsRef is now refreshed inside loadRentalVehicles on every vehicle load.

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

    if (routeActive) {
      clearMarkers();
    } else {
      placeMarkers(activeLocations);
    }
  }, [activeLocations, clearMarkers, dataset, mapReady, placeMarkers, routeActive]);

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
    resetMap,
    activeBookings,
    calculateTransitRoute,
    handleRouteToLocation,
    handleBooking,
    pendingBooking,
    confirmPendingBooking,
    cancelPendingBooking: () => setPendingBooking(null),
    pendingPayment,
    confirmPayment,
    cancelPayment,
  };
}
