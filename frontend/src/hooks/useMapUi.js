import { useMemo } from 'react';
import { RENTALS } from '../data/mockLocations';
import { TYPE_META } from '../components/map/mapConfig';

export function useMapUi(dataset, backendAvailable, transitStops = []) {
  const datasetSummary = useMemo(() => {
    if (dataset === 'RENTALS') {
      return [
        { label: 'Live options', value: RENTALS.length.toString() },
        {
          label: 'Starting at',
          value: `$${Math.min(...RENTALS.map((location) => location.pricePerMinute)).toFixed(2)}/min`,
        },
        { label: 'Booking', value: backendAvailable ? 'Connected' : 'Demo' },
      ];
    }

    if (dataset === 'TRANSIT') {
      const withAddressCount = transitStops.filter((stop) => stop.notes).length;
      return [
        { label: 'Transit stops', value: transitStops.length.toString() },
        { label: 'With address', value: withAddressCount.toString() },
        { label: 'Source', value: 'Google' },
      ];
    }

  }, [backendAvailable, dataset, transitStops]);

  const rentalLegend = useMemo(
    () => ['BIKE_SHARING', 'SCOOTER_SHARING', 'CAR_SHARING'].map((key) => TYPE_META[key]),
    [],
  );

  return {
    datasetSummary,
    rentalLegend,
  };
}

export function createMarkerIcon(color) {
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

export function createRideShareMarkerIcon(seatsLeft) {
  const label = seatsLeft > 0 ? String(seatsLeft) : '0';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="54" viewBox="0 0 44 54" fill="none">
      <path d="M22 2C13.1634 2 6 9.14107 6 17.95C6 30.65 22 52 22 52C22 52 38 30.65 38 17.95C38 9.14107 30.8366 2 22 2Z" fill="#7c3aed"/>
      <path d="M22 2C13.1634 2 6 9.14107 6 17.95C6 30.65 22 52 22 52C22 52 38 30.65 38 17.95C38 9.14107 30.8366 2 22 2Z" stroke="white" stroke-width="2.5"/>
      <circle cx="22" cy="18" r="9" fill="white" fill-opacity="0.95"/>
      <text x="22" y="22" text-anchor="middle" fill="#7c3aed" font-size="11" font-weight="700" font-family="Arial,sans-serif">${label}</text>
    </svg>
  `;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(40, 48),
    anchor: new window.google.maps.Point(20, 44),
  };
}

const INFO_COLORS = {
  BIKE_SHARING: { bg: 'rgba(91,154,139,0.15)', border: 'rgba(91,154,139,0.4)', text: '#5b9a8b' },
  SCOOTER_SHARING: { bg: 'rgba(192,133,74,0.15)', border: 'rgba(192,133,74,0.4)', text: '#c0854a' },
  CAR_SHARING: { bg: 'rgba(107,140,174,0.15)', border: 'rgba(107,140,174,0.4)', text: '#6b8cae' },
  PARKING: { bg: 'rgba(139,126,168,0.15)', border: 'rgba(139,126,168,0.4)', text: '#8b7ea8' },
  TRANSIT_BUS: { bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.4)', text: '#9ca3af' },
  TRANSIT_METRO: { bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.4)', text: '#9ca3af' },
  TRANSIT_STATION: { bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.4)', text: '#9ca3af' },
  RIDE_SHARE: { bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.35)', text: '#a78bfa' },
};

export function buildInfoWindowContent(location, dataset) {
  const meta = TYPE_META[location.type] ?? TYPE_META.PARKING;
  const c = INFO_COLORS[location.type] ?? INFO_COLORS.PARKING;

  if (dataset === 'RIDE_SHARE') {
    const c = INFO_COLORS.RIDE_SHARE;
    const isFull = location.seatsLeft <= 0;
    const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let actionBtn;
    if (location.isDriver) {
      actionBtn = `<div style="flex:1;padding:10px 0;background:rgba(124,58,237,0.15);color:#a78bfa;border:1px solid rgba(124,58,237,0.3);border-radius:12px;font-size:13px;font-weight:600;text-align:center">Your ride</div>`;
    } else if (location.isPassenger) {
      actionBtn = `<button onclick="window._mapLeaveClick('${location.id}')" style="flex:1;padding:10px 0;background:#374151;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Leave ride</button>`;
    } else if (isFull) {
      actionBtn = `<button disabled style="flex:1;padding:10px 0;background:#374151;color:#9ca3af;border:none;border-radius:12px;font-size:13px;font-weight:600;opacity:0.5;cursor:not-allowed">Ride full</button>`;
    } else {
      actionBtn = `<button onclick="window._mapJoinClick('${location.id}')" style="flex:1;padding:10px 0;background:#7c3aed;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Join ride</button>`;
    }

    return `<div style="font-family:Inter,Arial,sans-serif;min-width:248px;padding:4px">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:12px;background:${c.bg};border:1px solid ${c.border};color:${c.text};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">Shared Ride</div>
        <div style="font-size:11px;font-weight:600;color:${isFull ? '#ef4444' : '#a78bfa'}">${isFull ? 'Full' : `${location.seatsLeft} seat${location.seatsLeft !== 1 ? 's' : ''} left`}</div>
      </div>
      <div style="margin-top:12px;font-size:16px;font-weight:700;color:#0f172a">${location.pickupAddress || 'Pickup point'}</div>
      <div style="margin-top:6px;color:#475569;font-size:13px">${fmt(location.startTime)} → ${fmt(location.endTime)}</div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button onclick="window._mapRouteClick(${location.lat},${location.lng})" style="flex:1;padding:10px 0;background:#0f172a;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Route</button>
        ${actionBtn}
      </div>
    </div>`;
  }

  if (dataset === 'RENTALS') {
    const isFullyBooked = location.remaining !== undefined ? location.remaining <= 0 : (location.status && location.status !== 'AVAILABLE');
    const availText = location.remaining !== undefined
      ? (isFullyBooked ? 'Fully booked' : `${location.remaining}/${location.capacity} available`)
      : location.availabilityNote;
    const availColor = isFullyBooked ? '#ef4444' : '#22c55e';

    const bookBtn = isFullyBooked
      ? `<button disabled style="flex:1;padding:10px 0;background:#374151;color:#9ca3af;border:none;border-radius:12px;font-size:13px;font-weight:600;opacity:0.5;cursor:not-allowed">Fully booked</button>`
      : `<button onclick="window._mapBookClick('${location.type}',${location.lat},${location.lng})" style="flex:1;padding:10px 0;background:#374151;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Book</button>`;

    return `<div style="font-family:Inter,Arial,sans-serif;min-width:248px;padding:4px">
         <div style="display:flex;align-items:center;gap:8px">
           <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:12px;background:${c.bg};border:1px solid ${c.border};color:${c.text};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">${meta.label}</div>
           <div style="font-size:11px;font-weight:600;color:${availColor}">${availText}</div>
         </div>
         <div style="margin-top:12px;font-size:16px;font-weight:700;color:#0f172a">${location.name}</div>
         <div style="margin-top:6px;color:#475569;font-size:13px">$${location.pricePerMinute.toFixed(2)}/min</div>
         <div style="display:flex;gap:8px;margin-top:14px">
           <button onclick="window._mapRouteClick(${location.lat},${location.lng})" style="flex:1;padding:10px 0;background:#0f172a;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Route</button>
           ${bookBtn}
         </div>
       </div>`;
  }

  if (dataset === 'TRANSIT') {
    return `<div style="font-family:Inter,Arial,sans-serif;min-width:248px;padding:4px">
         <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:${c.bg};border:1px solid ${c.border};color:${c.text};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">${meta.label}</div>
         <div style="margin-top:12px;font-size:16px;font-weight:700;color:#0f172a">${location.name}</div>
         <div style="margin-top:6px;color:#475569;font-size:13px">Real transit station</div>
         <div style="margin-top:4px;color:#64748b;font-size:12px;line-height:1.45">${location.notes ?? 'Transit stop in Montreal network.'}</div>
         <button onclick="window._mapRouteClick(${location.lat},${location.lng})" style="margin-top:14px;width:100%;padding:10px 0;background:#0f172a;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Get route</button>
       </div>`;
  }

  return `<div style="font-family:Inter,Arial,sans-serif;min-width:248px;padding:4px">
         <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:${c.bg};border:1px solid ${c.border};color:${c.text};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">Parking</div>
         <div style="margin-top:12px;font-size:16px;font-weight:700;color:#0f172a">${location.facilityName}</div>
         <div style="margin-top:6px;color:#475569;font-size:13px;line-height:1.5">${location.notes}</div>
         <button onclick="window._mapRouteClick(${location.lat},${location.lng})" style="margin-top:14px;width:100%;padding:10px 0;background:#0f172a;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Get route</button>
       </div>`;
}