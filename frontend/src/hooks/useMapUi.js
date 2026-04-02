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

const INFO_COLORS = {
  BIKE_SHARING: { bg: 'rgba(91,154,139,0.15)', border: 'rgba(91,154,139,0.4)', text: '#5b9a8b' },
  SCOOTER_SHARING: { bg: 'rgba(192,133,74,0.15)', border: 'rgba(192,133,74,0.4)', text: '#c0854a' },
  CAR_SHARING: { bg: 'rgba(107,140,174,0.15)', border: 'rgba(107,140,174,0.4)', text: '#6b8cae' },
  PARKING: { bg: 'rgba(139,126,168,0.15)', border: 'rgba(139,126,168,0.4)', text: '#8b7ea8' },
  TRANSIT_BUS: { bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.4)', text: '#9ca3af' },
  TRANSIT_METRO: { bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.4)', text: '#9ca3af' },
  TRANSIT_STATION: { bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.4)', text: '#9ca3af' },
};

export function buildInfoWindowContent(location, dataset) {
  const meta = TYPE_META[location.type] ?? TYPE_META.PARKING;
  const c = INFO_COLORS[location.type] ?? INFO_COLORS.PARKING;

  if (dataset === 'RENTALS') {
    const isFullyBooked = location.remaining !== undefined ? location.remaining <= 0 : (location.status && location.status !== 'AVAILABLE');
    const availText = location.remaining !== undefined
      ? (isFullyBooked ? 'Fully booked' : `${location.remaining}/${location.capacity} available`)
      : location.availabilityNote;
    const availColor = isFullyBooked ? '#ef4444' : '#22c55e';

    const bookBtn = isFullyBooked
      ? `<button disabled style="flex:1;padding:10px 0;background:#1f2937;color:#6b7280;border:1px solid #374151;border-radius:12px;font-size:13px;font-weight:600;opacity:0.7;cursor:not-allowed">Fully booked</button>`
      : `<button onclick="window._mapBookClick('${location.type}',${location.lat},${location.lng})" style="flex:1;padding:10px 0;background:#374151;color:#f9fafb;border:1px solid #4b5563;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Book</button>`;

    return `<div style="font-family:Inter,Arial,sans-serif;min-width:248px;padding:4px">
         <div style="display:flex;align-items:center;gap:8px">
           <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:12px;background:${c.bg};border:1px solid ${c.border};color:${c.text};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">${meta.label}</div>
           <div style="font-size:11px;font-weight:600;color:${availColor}">${availText}</div>
         </div>
         <div style="margin-top:12px;font-size:16px;font-weight:700;color:#f3f4f6">${location.name}</div>
         <div style="margin-top:6px;color:#9ca3af;font-size:13px">$${location.pricePerMinute.toFixed(2)}/min</div>
         <div style="display:flex;gap:8px;margin-top:14px">
           <button onclick="window._mapRouteClick(${location.lat},${location.lng})" style="flex:1;padding:10px 0;background:#0b1220;color:#f9fafb;border:1px solid #374151;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Route</button>
           ${bookBtn}
         </div>
       </div>`;
  }

  if (dataset === 'TRANSIT') {
    return `<div style="font-family:Inter,Arial,sans-serif;min-width:248px;padding:4px">
         <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:${c.bg};border:1px solid ${c.border};color:${c.text};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">${meta.label}</div>
         <div style="margin-top:12px;font-size:16px;font-weight:700;color:#f3f4f6">${location.name}</div>
         <div style="margin-top:6px;color:#9ca3af;font-size:13px">Real transit station</div>
         <div style="margin-top:4px;color:#94a3b8;font-size:12px;line-height:1.45">${location.notes ?? 'Transit stop in Montreal network.'}</div>
         <button onclick="window._mapRouteClick(${location.lat},${location.lng})" style="margin-top:14px;width:100%;padding:10px 0;background:#0b1220;color:#f9fafb;border:1px solid #374151;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Get route</button>
       </div>`;
  }

  return `<div style="font-family:Inter,Arial,sans-serif;min-width:248px;padding:4px">
         <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:${c.bg};border:1px solid ${c.border};color:${c.text};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">Parking</div>
         <div style="margin-top:12px;font-size:16px;font-weight:700;color:#f3f4f6">${location.facilityName}</div>
         <div style="margin-top:6px;color:#9ca3af;font-size:13px;line-height:1.5">${location.notes}</div>
         <button onclick="window._mapRouteClick(${location.lat},${location.lng})" style="margin-top:14px;width:100%;padding:10px 0;background:#0b1220;color:#f9fafb;border:1px solid #374151;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Get route</button>
       </div>`;
}