import { ArrowRight, Sparkles, X } from 'lucide-react';
import { TYPE_META } from './mapConfig';

export default function SelectedLocationCard({ location, backendAvailable, onClose, onRoute, onBook }) {
  if (!location) return null;

  const meta = TYPE_META[location.type] ?? TYPE_META.PARKING;
  const Icon = meta.icon;
  const isRouteOnly = location.type === 'PARKING' || location.type?.startsWith('TRANSIT_');

  return (
    <div className="pointer-events-auto w-full max-w-sm rounded-[12px] border border-slate-700/80 bg-slate-900/86 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.5)] backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-100">{location.name}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {location.notes || location.availabilityNote || 'Recommended stop in central Montreal.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-700 bg-slate-900/70 p-2 text-slate-400 transition hover:border-slate-600 hover:text-slate-200"
          aria-label="Close selected location"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-slate-700/80 bg-slate-950/80 p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Rate</div>
          <div className="mt-2 text-lg font-semibold text-cyan-300">
            {location.pricePerMinute
              ? `$${location.pricePerMinute.toFixed(2)}/min`
              : location.type?.startsWith('TRANSIT_')
                ? 'Transit stop'
                : 'Public lot'}
          </div>
        </div>
        <div className="rounded-md border border-slate-700/80 bg-slate-950/80 p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Booking</div>
          <div className="mt-2 text-lg font-semibold text-slate-200">
            {isRouteOnly ? 'Route only' : backendAvailable ? 'Live ready' : 'Demo mode'}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onRoute}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-300"
        >
          <ArrowRight className="h-4 w-4" />
          Get route
        </button>
        {!isRouteOnly && (
          <button
            type="button"
            onClick={onBook}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-emerald-500/90 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-900/30 transition hover:-translate-y-0.5 hover:bg-emerald-500"
          >
            <Sparkles className="h-4 w-4" />
            {location.type}
            Book draft
          </button>
        )}
      </div>
    </div>
  );
}
