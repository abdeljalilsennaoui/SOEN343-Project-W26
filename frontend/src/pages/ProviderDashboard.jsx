import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getProviderVehicles,
  addProviderVehicle,
  updateProviderVehicle,
  deactivateProviderVehicle,
} from '../services/api';
import { loadGoogleMaps } from '../services/googleApiAdapter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CITIES = ['Montreal', 'Toronto', 'Vancouver'];
const TYPES = ['CAR_SHARING', 'BIKE_SHARING', 'SCOOTER_SHARING'];
const TYPE_LABELS = { CAR_SHARING: 'Car', BIKE_SHARING: 'Bike', SCOOTER_SHARING: 'Scooter' };

// Default city-center coordinates — used as vehicle placement when provider doesn't specify exact spot
const CITY_COORDS = {
  Montreal:  { lat: 45.5017, lng: -73.5673 },
  Toronto:   { lat: 43.6532, lng: -79.3832 },
  Vancouver: { lat: 49.2827, lng: -123.1207 },
};
const STATUS_COLORS = {
  AVAILABLE: 'bg-green-500/15 text-green-400',
  RESERVED: 'bg-yellow-500/15 text-yellow-400',
  IN_USE: 'bg-blue-500/15 text-blue-400',
  OUT_OF_SERVICE: 'bg-red-500/15 text-red-400',
};

const EMPTY_FORM = { city: 'Montreal', type: 'CAR_SHARING', pricePerMin: '', description: '' };

function LocationPicker({ city, onPick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [picked, setPicked] = useState(null);

  // Re-centre map when city changes
  const centre = CITY_COORDS[city] ?? CITY_COORDS.Montreal;

  const initMap = useCallback(async () => {
    if (!mapRef.current) return;
    await loadGoogleMaps();

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: centre,
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [{ elementType: 'geometry', stylers: [{ color: '#1e2330' }] },
                 { elementType: 'labels.text.fill', stylers: [{ color: '#a0a8b8' }] },
                 { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d3348' }] },
                 { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1117' }] }],
      });

      mapInstanceRef.current.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
        } else {
          markerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current,
            title: 'Vehicle location',
            animation: window.google.maps.Animation.DROP,
          });
        }

        setPicked({ lat, lng });
        onPick({ lat, lng });
      });
    } else {
      mapInstanceRef.current.setCenter(centre);
      // Clear marker when city changes
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      setPicked(null);
      onPick(null);
    }
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { initMap(); }, [initMap]);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        Vehicle location <span className="text-red-400">*</span>
        <span className="ml-1 font-normal text-gray-500">— click the map to drop a pin</span>
      </label>
      <div ref={mapRef} className="w-full h-52 rounded-md overflow-hidden border border-gray-600" />
      {picked ? (
        <p className="mt-1 text-xs text-green-400">
          Pin set: {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
        </p>
      ) : (
        <p className="mt-1 text-xs text-yellow-500">No pin set — click on the map above</p>
      )}
    </div>
  );
}

function VehicleForm({ initial = EMPTY_FORM, onSubmit, onCancel, submitLabel, requireLocation = false }) {
  const [form, setForm] = useState(initial);
  const [pickedCoords, setPickedCoords] = useState(
    initial.lat && initial.lng ? { lat: initial.lat, lng: initial.lng } : null
  );
  const [locationError, setLocationError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function handleSubmit(e) {
    e.preventDefault();
    if (requireLocation && !pickedCoords) {
      setLocationError('Please drop a pin on the map to set the vehicle location.');
      return;
    }
    setLocationError('');
    const coords = pickedCoords ?? CITY_COORDS[form.city] ?? CITY_COORDS.Montreal;
    onSubmit({ ...form, pricePerMin: parseFloat(form.pricePerMin), ...coords });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">City</label>
          <Select value={form.city} onValueChange={(value) => { set('city', value); setPickedCoords(null); }}>
            <SelectTrigger className="w-full border-gray-600 bg-[#0d0f14] text-[#e8eaf0] focus-visible:border-gray-300 focus-visible:ring-0">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
          <Select value={form.type} onValueChange={(value) => set('type', value)}>
            <SelectTrigger className="w-full border-gray-600 bg-[#0d0f14] text-[#e8eaf0] focus-visible:border-gray-300 focus-visible:ring-0">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Price per minute ($)</label>
        <input type="number" step="0.01" min="0.01" required value={form.pricePerMin}
          onChange={(e) => set('pricePerMin', e.target.value)} placeholder="0.50"
          className="w-full border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] placeholder-gray-500 rounded-md px-3 py-2 text-sm transition-colors focus:border-gray-300 focus:outline-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Description (optional)</label>
        <input value={form.description} onChange={(e) => set('description', e.target.value)}
          placeholder="e.g. Clean compact car near downtown"
          className="w-full border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] placeholder-gray-500 rounded-md px-3 py-2 text-sm transition-colors focus:border-gray-300 focus:outline-none" />
      </div>

      {requireLocation && (
        <LocationPicker city={form.city} onPick={(coords) => { setPickedCoords(coords); setLocationError(''); }} />
      )}
      {locationError && <p className="text-xs text-red-400">{locationError}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit"
          className="flex-1 bg-gray-100 text-black py-2 rounded-md text-sm font-medium transition-colors hover:bg-white active:bg-gray-300">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 border border-gray-500 text-gray-300 py-2 rounded-md text-sm transition-colors hover:border-gray-400 hover:text-white">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ProviderDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionError, setActionError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await getProviderVehicles();
      setVehicles(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(data) {
    setActionError('');
    try {
      await addProviderVehicle(data);
      setShowAddForm(false);
      load();
    } catch (err) {
      setActionError(err.message || 'Failed to add vehicle');
    }
  }

  async function handleUpdate(vehicleId, data) {
    setActionError('');
    try {
      await updateProviderVehicle(vehicleId, data);
      setEditingId(null);
      load();
    } catch (err) {
      setActionError(err.message || 'Failed to update vehicle');
    }
  }

  async function handleDeactivate(vehicleId) {
    setActionError('');
    if (!confirm('Deactivate this vehicle? It will be marked OUT_OF_SERVICE.')) return;
    try {
      await deactivateProviderVehicle(vehicleId);
      load();
    } catch (err) {
      setActionError(err.message || 'Failed to deactivate vehicle');
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#e8eaf0]">Provider Dashboard</h1>
          <p className="text-gray-400 text-sm">Manage your fleet</p>
        </div>
        {!showAddForm && (
          <button onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="bg-gray-100 text-black px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white active:bg-gray-300">
            + Add Vehicle
          </button>
        )}
      </div>

      {actionError && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 rounded-md px-4 py-3 text-sm mb-4">
          {actionError}
        </div>
      )}

      {showAddForm && (
        <div className="bg-[#13161d] border border-[#1e2330] rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-[#e8eaf0] mb-4">Add New Vehicle</h3>
          <VehicleForm onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} submitLabel="Add Vehicle" requireLocation />
        </div>
      )}

      {loading && <p className="text-gray-500 text-center py-12">Loading fleet…</p>}
      {!loading && error && <p className="text-red-400 text-center">{error}</p>}
      {!loading && !error && vehicles.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🚗</p>
          <p>No vehicles in your fleet yet. Add one to get started.</p>
        </div>
      )}

      {!loading && vehicles.length > 0 && (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-[#13161d] border border-[#1e2330] rounded-lg p-4">
              {editingId === v.id ? (
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-3">Editing vehicle</p>
                  <VehicleForm
                    initial={{ city: v.city, type: v.type, pricePerMin: v.pricePerMin, description: v.description || '' }}
                    onSubmit={(data) => handleUpdate(v.id, data)}
                    onCancel={() => setEditingId(null)}
                    submitLabel="Save Changes"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[#e8eaf0]">{TYPE_LABELS[v.type]} — {v.city}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[v.status] || 'bg-gray-500/15 text-gray-400'}`}>
                        {v.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">${v.pricePerMin?.toFixed(2)}/min</p>
                    {v.description && <p className="text-xs text-gray-500 mt-0.5">{v.description}</p>}
                  </div>
                  {v.status !== 'OUT_OF_SERVICE' && (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(v.id); setShowAddForm(false); }}
                        className="text-sm border border-blue-500/50 text-blue-400 px-3 py-1.5 rounded-md transition-colors hover:border-blue-400 hover:text-blue-300">
                        Edit
                      </button>
                      <button onClick={() => handleDeactivate(v.id)}
                        className="text-sm border border-red-500/50 text-red-400 px-3 py-1.5 rounded-md transition-colors hover:border-red-400 hover:text-red-300">
                        Deactivate
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
