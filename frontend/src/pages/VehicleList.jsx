import { useState, useEffect, useCallback } from 'react';
import { getProviderVehicles, addProviderVehicle, updateProviderVehicle, deactivateProviderVehicle, getMyProfile } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import ErrorMessage from '../components/ErrorMessage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CITIES = ['', 'Montreal', 'Toronto', 'Vancouver'];
const TYPES = ['', 'CAR_SHARING', 'BIKE_SHARING', 'SCOOTER_SHARING'];

const TYPE_LABELS = {
  '': 'All Types',
  CAR_SHARING: 'Car',
  BIKE_SHARING: 'Bike',
  SCOOTER_SHARING: 'Scooter',
};

const ALL_CITIES_VALUE = 'ALL_CITIES';
const ALL_TYPES_VALUE = 'ALL_TYPES';

const AVAILABILITY_OPTIONS = [
  'AVAILABLE',
  'RESERVED',
  'IN_USE',
  'OUT_OF_SERVICE',
];

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    city: 'Montreal',
    type: 'CAR_SHARING',
    pricePerMin: 0.5,
    lat: 45,
    lng: -73,
    description: '',
    status: 'AVAILABLE',
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProviderVehicles();
      let filtered = data.data || [];
      if (city) filtered = filtered.filter((v) => v.city === city);
      if (type) filtered = filtered.filter((v) => v.type === type);
      setVehicles(filtered);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [city, type]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await getMyProfile();
        setUserProfile(res.data);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const isCityAdmin = userProfile?.role === 'CITY_ADMINISTRATOR';

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      city: 'Montreal',
      type: 'CAR_SHARING',
      pricePerMin: 0.5,
      lat: 45,
      lng: -73,
      description: '',
      status: 'AVAILABLE',
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      city: vehicle.city,
      type: vehicle.type,
      pricePerMin: vehicle.pricePerMin,
      lat: vehicle.lat ?? 45,
      lng: vehicle.lng ?? -73,
      description: vehicle.description || '',
      status: vehicle.status || 'AVAILABLE',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pricePerMin' || name === 'lat' || name === 'lng' ? Number(value) : value
    }));
  };

  const handleFormSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingVehicle) {
        await updateProviderVehicle(editingVehicle.id, formData);
      } else {
        const createPayload = { ...formData };
        delete createPayload.status;
        await addProviderVehicle(createPayload);
      }
      setShowModal(false);
      await fetchVehicles();
    } catch (err) {
      setFormError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;

    setError(null);
    try {
      await deactivateProviderVehicle(vehicleId);

      setVehicles(prev => prev.filter(v => v.id !== vehicleId));

      await fetchVehicles();
    } catch (err) {
      setError(err.message || 'Failed to delete vehicle');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#e8eaf0]">Available Vehicles</h2>
        <button
          onClick={openAddModal}
          disabled={!isCityAdmin || profileLoading}
          className="bg-gray-100 text-black px-4 py-2 rounded-md font-medium transition-colors hover:bg-white active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Vehicle
        </button>
      </div>

      {!isCityAdmin && !profileLoading && (
        <div className="mb-6 p-4 rounded-md bg-blue-500/10 border border-blue-500/30">
          <p className="text-blue-400 text-sm">
            This page shows all available vehicles.{' '}
            {userProfile?.role === 'MOBILITY_PROVIDER' && (
              <>To manage your own fleet, go to the <a href="/provider" className="underline font-medium hover:text-blue-300">Provider Dashboard</a>.</>
            )}
          </p>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <Select
          value={city || ALL_CITIES_VALUE}
          onValueChange={(value) => setCity(value === ALL_CITIES_VALUE ? '' : value)}
        >
          <SelectTrigger className="w-[180px] border-gray-600 bg-[#13161d] text-[#e8eaf0] focus-visible:border-gray-300 focus-visible:ring-0">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c || ALL_CITIES_VALUE} value={c || ALL_CITIES_VALUE}>
                {c || 'All Cities'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={type || ALL_TYPES_VALUE}
          onValueChange={(value) => setType(value === ALL_TYPES_VALUE ? '' : value)}
        >
          <SelectTrigger className="w-[180px] border-gray-600 bg-[#13161d] text-[#e8eaf0] focus-visible:border-gray-300 focus-visible:ring-0">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t || ALL_TYPES_VALUE} value={t || ALL_TYPES_VALUE}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ErrorMessage error={error} />

      {loading ? (
        <p className="text-gray-500 text-center py-8">Loading vehicles...</p>
      ) : vehicles.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No vehicles found matching your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onEdit={isCityAdmin ? openEditModal : undefined}
              onDelete={isCityAdmin ? handleDelete : undefined}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#13161d] border border-[#1e2330] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-[#e8eaf0]">
              {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </h3>

            <ErrorMessage error={formError} />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">City</label>
                <Select value={formData.city} onValueChange={(value) => handleFormSelectChange('city', value)}>
                  <SelectTrigger className="w-full border-gray-600 bg-[#0d0f14] text-[#e8eaf0] focus-visible:border-gray-300 focus-visible:ring-0">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.filter(c => c).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                <Select value={formData.type} onValueChange={(value) => handleFormSelectChange('type', value)}>
                  <SelectTrigger className="w-full border-gray-600 bg-[#0d0f14] text-[#e8eaf0] focus-visible:border-gray-300 focus-visible:ring-0">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.filter(t => t).map((t) => (
                      <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Price per Min ($)</label>
                <input
                  type="number"
                  name="pricePerMin"
                  value={formData.pricePerMin}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] rounded-md transition-colors focus:border-gray-300 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    name="lat"
                    value={formData.lat}
                    onChange={handleFormChange}
                    step="0.0001"
                    className="w-full px-3 py-2 border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] rounded-md transition-colors focus:border-gray-300 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    name="lng"
                    value={formData.lng}
                    onChange={handleFormChange}
                    step="0.0001"
                    className="w-full px-3 py-2 border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] rounded-md transition-colors focus:border-gray-300 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] rounded-md text-sm transition-colors focus:border-gray-300 focus:outline-none"
                  rows="2"
                />
              </div>

              {editingVehicle && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Availability</label>
                  <Select value={formData.status} onValueChange={(value) => handleFormSelectChange('status', value)}>
                    <SelectTrigger className="w-full border-gray-600 bg-[#0d0f14] text-[#e8eaf0] focus-visible:border-gray-300 focus-visible:ring-0">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-500 rounded-md text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gray-100 text-black rounded-md font-medium transition-colors hover:bg-white active:bg-gray-300 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingVehicle ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleList;
