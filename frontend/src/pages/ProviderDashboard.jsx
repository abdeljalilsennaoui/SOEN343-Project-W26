import { useState, useEffect } from 'react';
import {
  getProviderVehicles,
  addProviderVehicle,
  updateProviderVehicle,
  deactivateProviderVehicle,
} from '../services/api';

const CITIES = ['Montreal', 'Toronto', 'Vancouver'];
const TYPES = ['CAR_SHARING', 'BIKE_SHARING', 'SCOOTER_SHARING'];
const TYPE_LABELS = { CAR_SHARING: 'Car', BIKE_SHARING: 'Bike', SCOOTER_SHARING: 'Scooter' };
const STATUS_COLORS = {
  AVAILABLE: 'bg-green-100 text-green-700',
  RESERVED: 'bg-yellow-100 text-yellow-700',
  IN_USE: 'bg-blue-100 text-blue-700',
  OUT_OF_SERVICE: 'bg-red-100 text-red-600',
};

const EMPTY_FORM = { city: 'Montreal', type: 'CAR_SHARING', pricePerMin: '', description: '' };

function VehicleForm({ initial = EMPTY_FORM, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ ...form, pricePerMin: parseFloat(form.pricePerMin) });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
          <select value={form.city} onChange={(e) => set('city', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
            {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Price per minute ($)</label>
        <input type="number" step="0.01" min="0.01" required value={form.pricePerMin}
          onChange={(e) => set('pricePerMin', e.target.value)} placeholder="0.50"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
        <input value={form.description} onChange={(e) => set('description', e.target.value)}
          placeholder="e.g. Clean compact car near downtown"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit"
          className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
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
          <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage your fleet</p>
        </div>
        {!showAddForm && (
          <button onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
            + Add Vehicle
          </button>
        )}
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {actionError}
        </div>
      )}

      {showAddForm && (
        <div className="bg-white border rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Add New Vehicle</h3>
          <VehicleForm onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} submitLabel="Add Vehicle" />
        </div>
      )}

      {loading && <p className="text-gray-400 text-center py-12">Loading fleet…</p>}
      {!loading && error && <p className="text-red-600 text-center">{error}</p>}
      {!loading && !error && vehicles.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🚗</p>
          <p>No vehicles in your fleet yet. Add one to get started.</p>
        </div>
      )}

      {!loading && vehicles.length > 0 && (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white border rounded-xl p-4 shadow-sm">
              {editingId === v.id ? (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-3">Editing vehicle</p>
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
                      <span className="font-medium text-gray-800">{TYPE_LABELS[v.type]} — {v.city}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[v.status] || 'bg-gray-100 text-gray-600'}`}>
                        {v.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">${v.pricePerMin?.toFixed(2)}/min</p>
                    {v.description && <p className="text-xs text-gray-400 mt-0.5">{v.description}</p>}
                  </div>
                  {v.status !== 'OUT_OF_SERVICE' && (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(v.id); setShowAddForm(false); }}
                        className="text-sm text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDeactivate(v.id)}
                        className="text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
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
