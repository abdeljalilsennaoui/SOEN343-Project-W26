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

export function buildInfoWindowContent(location, dataset) {
  const meta = TYPE_META[location.type] ?? TYPE_META.PARKING;

  if (dataset === 'RENTALS') {
    return `<div style="font-family:Inter,Arial,sans-serif;min-width:248px;padding:4px">
         <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:12px;background:#f3f4f6;border:1px solid #d1d5db;color:#374151;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">${meta.label}</div>
         <div style="margin-top:12px;font-size:16px;font-weight:700;color:#0f172a">${location.name}</div>
         <div style="margin-top:6px;color:#475569;font-size:13px">$${location.pricePerMinute.toFixed(2)}/min · ${location.availabilityNote}</div>
         <div style="display:flex;gap:8px;margin-top:14px">
           <button onclick="window._mapRouteClick(${location.lat},${location.lng})" style="flex:1;padding:10px 0;background:#0f172a;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Route</button>
           <button onclick="window._mapBookClick('${location.type}',${location.lat},${location.lng})" style="flex:1;padding:10px 0;background:#374151;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Book</button>
         </div>
       </div>`;
  }

  if (dataset === 'TRANSIT') {
    return `<div style="font-family:Inter,Arial,sans-serif;min-width:248px;padding:4px">
         <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:#f3f4f6;border:1px solid #d1d5db;color:#374151;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">${meta.label}</div>
         <div style="margin-top:12px;font-size:16px;font-weight:700;color:#0f172a">${location.name}</div>
         <div style="margin-top:6px;color:#475569;font-size:13px">Real transit station</div>
         <div style="margin-top:4px;color:#64748b;font-size:12px;line-height:1.45">${location.notes ?? 'Transit stop in Montreal network.'}</div>
         <button onclick="window._mapRouteClick(${location.lat},${location.lng})" style="margin-top:14px;width:100%;padding:10px 0;background:#0f172a;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Get route</button>
       </div>`;
  }

  return `<div style="font-family:Inter,Arial,sans-serif;min-width:248px;padding:4px">
         <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:#f3f4f6;border:1px solid #d1d5db;color:#374151;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">Parking</div>
         <div style="margin-top:12px;font-size:16px;font-weight:700;color:#0f172a">${location.facilityName}</div>
         <div style="margin-top:6px;color:#475569;font-size:13px;line-height:1.5">${location.notes}</div>
         <button onclick="window._mapRouteClick(${location.lat},${location.lng})" style="margin-top:14px;width:100%;padding:10px 0;background:#0f172a;color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600">Get route</button>
       </div>`;
}