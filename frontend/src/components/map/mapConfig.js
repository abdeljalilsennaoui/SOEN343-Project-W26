import { Bike, Bus, Car, Navigation, ParkingSquare, TrainFront } from 'lucide-react';

export const MONTREAL = { lat: 45.5017, lng: -73.5673 };

export const MAP_THEME = [
  { elementType: 'geometry', stylers: [{ color: '#1a1d27' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1d27' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2a2d3d' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e2330' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#24312c' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#252836' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#202434' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2d3145' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#3a3f57' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2b313b' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1520' }] },
];

export const TYPE_META = {
  BIKE_SHARING: {
    label: 'Bike',
    icon: Bike,
    markerColor: '#d1d5db',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  SCOOTER_SHARING: {
    label: 'Scooter',
    icon: Navigation,
    markerColor: '#9ca3af',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  CAR_SHARING: {
    label: 'Car',
    icon: Car,
    markerColor: '#4b5563',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  PARKING: {
    label: 'Parking',
    icon: ParkingSquare,
    markerColor: '#6b7280',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  TRANSIT_BUS: {
    label: 'Transit Bus',
    icon: Bus,
    markerColor: '#9ca3af',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  TRANSIT_METRO: {
    label: 'Transit Metro',
    icon: TrainFront,
    markerColor: '#6b7280',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  TRANSIT_STATION: {
    label: 'Transit',
    icon: TrainFront,
    markerColor: '#d1d5db',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
  },
};
