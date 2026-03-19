import { ArrowRight, Sparkles, X } from 'lucide-react';
import { TYPE_META } from './mapConfig';

export default function SelectedLocationCard({ location, backendAvailable, onClose, onRoute, onBook }) {
  if (!location) return null;

  const meta = TYPE_META[location.type] ?? TYPE_META.PARKING;
  const Icon = meta.icon;

  return (
    <div className="pointer-events-auto w-full max-w-sm rounded-[12px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">{location.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {location.notes || location.availabilityNote || 'Recommended pickup point in central Montreal.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 bg-white/70 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          aria-label="Close selected location"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-slate-200/80 bg-slate-50/80 p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Rate</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {location.pricePerMinute ? `$${location.pricePerMinute.toFixed(2)}/min` : 'Public lot'}
          </div>
        </div>
        <div className="rounded-md border border-slate-200/80 bg-slate-50/80 p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Booking</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {location.type === 'PARKING' ? 'Route only' : backendAvailable ? 'Live ready' : 'Demo mode'}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onRoute}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <ArrowRight className="h-4 w-4" />
          Get route
        </button>
        {location.type !== 'PARKING' && (
          <button
            type="button"
            onClick={onBook}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            <Sparkles className="h-4 w-4" />
            Book draft
          </button>
        )}
      </div>
    </div>
  );
}
