import { Bike, Car, Navigation, ParkingSquare } from 'lucide-react';

export const MONTREAL = { lat: 45.5017, lng: -73.5673 };

export const MAP_THEME = [
  { elementType: 'geometry', stylers: [{ color: '#eef2ff' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#dcfce7' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#dbe4f0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#c7d2fe' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#a5b4fc' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bfe5fe' }] },
];

export const TYPE_META = {
  BIKE_SHARING: {
    label: 'Bike',
    icon: Bike,
    markerColor: '#2563eb',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  SCOOTER_SHARING: {
    label: 'Scooter',
    icon: Navigation,
    markerColor: '#10b981',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  CAR_SHARING: {
    label: 'Car',
    icon: Car,
    markerColor: '#111827',
    badgeClass: 'bg-slate-200 text-slate-700 border-slate-300',
  },
  PARKING: {
    label: 'Parking',
    icon: ParkingSquare,
    markerColor: '#f59e0b',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
  },
};
