import { useState } from 'react';
import { searchMobilityOptions, createBookingDraft, confirmBooking, completeBooking } from '../services/api';

const CITIES = ['Montreal', 'Toronto', 'Vancouver'];
const TYPES = ['CAR_SHARING', 'BIKE_SHARING', 'SCOOTER_SHARING'];
const TYPE_LABELS = { CAR_SHARING: 'Car Sharing', BIKE_SHARING: 'Bike Sharing', SCOOTER_SHARING: 'Scooter Sharing' };

const steps = ['Search', 'Select Option', 'Payment', 'Confirmation'];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
            i < current ? 'bg-green-500 text-white' :
            i === current ? 'bg-gray-100 text-black' :
            'bg-[#1e2330] text-gray-500'
          }`}>{i < current ? '✓' : i + 1}</div>
          {i < steps.length - 1 && (
            <div className={`w-16 h-1 mx-1 ${i < current ? 'bg-green-500' : 'bg-[#1e2330]'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Step 1: Search
function SearchStep({ onResults }) {
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().slice(0, 16);

  const [form, setForm] = useState({
    city: 'Montreal',
    type: '',
    startTime: fmt(now),
    endTime: fmt(later),
    maxPrice: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSearch(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const params = {
        city: form.city,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      };
      if (form.type) params.type = form.type;
      if (form.maxPrice) params.maxPrice = parseFloat(form.maxPrice);
      const res = await searchMobilityOptions(params);
      onResults(res.data, params);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSearch} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-[#e8eaf0]">Find a Mobility Option</h2>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">City</label>
        <select value={form.city} onChange={(e) => set('city', e.target.value)}
          className="w-full border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] rounded-md px-3 py-2 text-sm transition-colors focus:border-gray-300 focus:outline-none">
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Type (optional)</label>
        <select value={form.type} onChange={(e) => set('type', e.target.value)}
          className="w-full border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] rounded-md px-3 py-2 text-sm transition-colors focus:border-gray-300 focus:outline-none">
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Start time</label>
          <input type="datetime-local" value={form.startTime}
            onChange={(e) => set('startTime', e.target.value)}
            className="w-full border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] rounded-md px-3 py-2 text-sm transition-colors focus:border-gray-300 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">End time</label>
          <input type="datetime-local" value={form.endTime}
            onChange={(e) => set('endTime', e.target.value)}
            className="w-full border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] rounded-md px-3 py-2 text-sm transition-colors focus:border-gray-300 focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Max price ($/min, optional)</label>
        <input type="number" step="0.01" min="0" value={form.maxPrice}
          onChange={(e) => set('maxPrice', e.target.value)} placeholder="e.g. 1.00"
          className="w-full border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] placeholder-gray-500 rounded-md px-3 py-2 text-sm transition-colors focus:border-gray-300 focus:outline-none" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-gray-100 text-black py-2 rounded-md text-sm font-medium transition-colors hover:bg-white active:bg-gray-300 disabled:opacity-50">
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}

// Step 2: Select Option
function SelectStep({ results, searchParams, onSelect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rideSharing, setRideSharing] = useState(false);
  const [maxPassengers, setMaxPassengers] = useState(1);
  const [pickingId, setPickingId] = useState(null);

  async function handlePick(option) {
    setError('');
    setLoading(true);
    setPickingId(option.optionId);
    const isCarSharing = option.type === 'CAR_SHARING';
    try {
      const res = await createBookingDraft(
        option.optionId,
        searchParams.startTime,
        searchParams.endTime,
        searchParams.city,
        isCarSharing ? rideSharing : false,
        isCarSharing && rideSharing ? maxPassengers : 0,
      );
      onSelect(option, res.data);
    } catch (err) {
      setError(err.message || 'Could not create booking draft');
    } finally {
      setLoading(false);
      setPickingId(null);
    }
  }

  if (!results.length) {
    return <p className="text-center text-gray-500">No options found. Try different filters.</p>;
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-[#e8eaf0]">Choose an Option</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {results.map((opt) => (
        <div key={opt.optionId}
          className="border border-[#1e2330] rounded-lg p-4 bg-[#13161d] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#e8eaf0]">{TYPE_LABELS[opt.type] || opt.type}</p>
              <p className="text-sm text-gray-500">{opt.shortDescription}</p>
              <p className="text-sm text-gray-400 mt-1">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                  opt.availability ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                }`}>{opt.availability
                  ? `${opt.remaining ?? '?'}/${opt.capacity ?? '?'} available`
                  : 'Fully booked'
                }</span>
                Est. <strong>${opt.estimatedPrice?.toFixed(2)}</strong>
              </p>
            </div>
            <button onClick={() => handlePick(opt)} disabled={loading || !opt.availability}
              className="bg-gray-100 text-black px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white active:bg-gray-300 disabled:opacity-40 shrink-0">
              {pickingId === opt.optionId ? '…' : 'Select'}
            </button>
          </div>

          {opt.type === 'CAR_SHARING' && opt.availability && (
            <div className="border-t border-[#1e2330] pt-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rideSharing}
                  onChange={(e) => setRideSharing(e.target.checked)}
                  className="w-4 h-4 accent-gray-300"
                />
                <span className="text-sm text-gray-300">Offer ride sharing (carpooling)</span>
              </label>
              {rideSharing && (
                <div className="flex items-center gap-3 pl-6">
                  <label className="text-sm text-gray-400">Max passengers:</label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    value={maxPassengers}
                    onChange={(e) => setMaxPassengers(Number(e.target.value))}
                    className="w-16 border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] rounded-md px-2 py-1 text-sm text-center focus:border-gray-300 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Step 3: Payment
function PaymentStep({ draft, onPaid }) {
  const [form, setForm] = useState({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handlePay(e) {
    e.preventDefault();
    setError('');
    if (!form.cardName || !form.cardNumber || !form.expiry || !form.cvv) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      const paymentToken = form.cardNumber === '0000000000000000' ? 'fail' : 'tok_demo';
      const res = await confirmBooking(draft.id, paymentToken);
      onPaid(res.data);
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-[#e8eaf0]">Payment</h2>

      <div className="bg-blue-500/15 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
        <p className="font-medium">Booking Summary</p>
        <p className="mt-1">Amount due: <strong>${draft.totalPrice?.toFixed(2)}</strong></p>
        <p className="text-xs text-blue-400 mt-1">Use card number 0000 0000 0000 0000 to simulate a failure.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Cardholder name</label>
        <input value={form.cardName} onChange={(e) => set('cardName', e.target.value)}
          placeholder="Jane Doe"
          className="w-full border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] placeholder-gray-500 rounded-md px-3 py-2 text-sm transition-colors focus:border-gray-300 focus:outline-none" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Card number</label>
        <input value={form.cardNumber} onChange={(e) => set('cardNumber', e.target.value.replace(/\D/g, '').slice(0, 16))}
          placeholder="4242 4242 4242 4242" maxLength={16}
          className="w-full border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] placeholder-gray-500 rounded-md px-3 py-2 text-sm font-mono transition-colors focus:border-gray-300 focus:outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Expiry</label>
          <input value={form.expiry} onChange={(e) => set('expiry', e.target.value)}
            placeholder="MM/YY"
            className="w-full border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] placeholder-gray-500 rounded-md px-3 py-2 text-sm transition-colors focus:border-gray-300 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">CVV</label>
          <input value={form.cvv} onChange={(e) => set('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123" maxLength={4}
            className="w-full border border-gray-600 bg-[#0d0f14] text-[#e8eaf0] placeholder-gray-500 rounded-md px-3 py-2 text-sm transition-colors focus:border-gray-300 focus:outline-none" />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded-md text-sm font-medium transition-colors hover:bg-green-500 disabled:opacity-50">
        {loading ? 'Processing…' : `Pay $${draft.totalPrice?.toFixed(2)}`}
      </button>
    </form>
  );
}

// Step 4: Confirmation
function ConfirmationStep({ result, onReturn }) {
  const { booking, receipt } = result;
  const [returning, setReturning] = useState(false);
  const [returned, setReturned] = useState(false);
  const [error, setError] = useState('');

  async function handleReturn() {
    setReturning(true);
    setError('');
    try {
      await completeBooking(booking.id);
      setReturned(true);
    } catch (err) {
      setError(err.message || 'Return failed');
    } finally {
      setReturning(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-3">{returned ? '🏁' : '✅'}</div>
        <h2 className="text-2xl font-bold text-[#e8eaf0]">{returned ? 'Trip Complete' : 'Booking Confirmed!'}</h2>
        <p className="text-gray-400 text-sm mt-1">{returned ? 'Thank you for using SUMMS.' : 'Your vehicle is ready.'}</p>
      </div>

      <div className="bg-[#0d0f14] border border-[#1e2330] rounded-lg p-4 text-sm space-y-2">
        <div className="flex justify-between"><span className="text-gray-500">Booking ID</span><span className="font-mono text-xs text-gray-300">{booking.id.slice(0, 8)}…</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`font-medium ${returned ? 'text-gray-500' : 'text-green-400'}`}>{returned ? 'COMPLETE' : booking.status}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Amount paid</span><span className="font-medium text-[#e8eaf0]">${receipt.amount?.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Transaction ref</span><span className="font-mono text-xs text-gray-300">{receipt.providerRef?.slice(0, 12)}…</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Start</span><span className="text-gray-300">{new Date(booking.startTime).toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">End</span><span className="text-gray-300">{new Date(booking.endTime).toLocaleString()}</span></div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!returned && (
        <button onClick={handleReturn} disabled={returning}
          className="w-full bg-gray-100 text-black py-2 rounded-md text-sm font-medium transition-colors hover:bg-white active:bg-gray-300 disabled:opacity-50">
          {returning ? 'Completing trip…' : 'Complete Trip (Return Vehicle)'}
        </button>
      )}

      <button onClick={onReturn}
        className="w-full border border-gray-500 text-gray-300 py-2 rounded-md text-sm font-medium transition-colors hover:border-gray-400 hover:text-white">
        Book Another
      </button>
    </div>
  );
}

// Main BookingFlow page
export default function BookingFlow() {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState([]);
  const [searchParams, setSearchParams] = useState(null);
  const [draft, setDraft] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  function reset() {
    setStep(0);
    setResults([]);
    setSearchParams(null);
    setDraft(null);
    setConfirmation(null);
  }

  return (
    <div className="min-h-screen bg-[#0d0f14] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#e8eaf0] mb-2 text-center">Book a Ride</h1>
        <p className="text-gray-400 text-center text-sm mb-8">Search, select, and pay in a few steps.</p>
        <StepIndicator current={step} />

        <div className="bg-[#13161d] border border-[#1e2330] rounded-lg p-8">
          {step === 0 && (
            <SearchStep onResults={(r, p) => { setResults(r); setSearchParams(p); setStep(1); }} />
          )}
          {step === 1 && (
            <SelectStep results={results} searchParams={searchParams}
              onSelect={(opt, d) => { setDraft(d); setStep(2); }} />
          )}
          {step === 2 && draft && (
            <PaymentStep draft={draft} onPaid={(r) => { setConfirmation(r); setStep(3); }} />
          )}
          {step === 3 && confirmation && (
            <ConfirmationStep result={confirmation} onReturn={reset} />
          )}
        </div>
      </div>
    </div>
  );
}
