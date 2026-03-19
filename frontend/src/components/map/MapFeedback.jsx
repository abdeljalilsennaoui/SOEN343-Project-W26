import { Navigation, X } from 'lucide-react';

export function MapBookingStatus({ bookingStatus, onDismiss }) {
  if (!bookingStatus) return null;

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between gap-3 rounded-[24px] border px-4 py-3 shadow-xl backdrop-blur-xl ${
        bookingStatus.ok
          ? 'border-emerald-200/80 bg-emerald-50/90 text-emerald-900'
          : 'border-rose-200/80 bg-rose-50/90 text-rose-900'
      }`}
    >
      <p className="text-sm leading-6">{bookingStatus.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-full p-1 text-current/60 transition hover:bg-white/60 hover:text-current"
        aria-label="Dismiss booking status"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function MapRouteInfo({ routeInfo, onClearRoute }) {
  if (!routeInfo) return null;

  return (
    <div className="pointer-events-auto rounded-[12px] border border-white/70 bg-white/86 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.15)] backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Navigation className="h-4 w-4 text-indigo-500" />
        Active route
      </div>
      <p className="text-lg font-semibold text-slate-950">{routeInfo.destinationName}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-slate-200/80 bg-slate-50/80 p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">ETA</div>
          <div className="mt-1 text-base font-semibold text-slate-900">{routeInfo.durationText}</div>
        </div>
        <div className="rounded-md border border-slate-200/80 bg-slate-50/80 p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Distance</div>
          <div className="mt-1 text-base font-semibold text-slate-900">{routeInfo.distanceText}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClearRoute}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <X className="h-4 w-4" />
        Clear route
      </button>
    </div>
  );
}
