import { Navigation, X } from 'lucide-react';

export function MapBookingStatus({ bookingStatus, onDismiss }) {
  if (!bookingStatus) return null;

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between gap-3 rounded-[24px] border px-4 py-3 shadow-xl backdrop-blur-xl ${
        bookingStatus.ok
          ? 'border-emerald-400/40 bg-emerald-950/70 text-emerald-200'
          : 'border-rose-400/40 bg-rose-950/70 text-rose-200'
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
    <div className="pointer-events-auto rounded-[12px] border border-slate-700/80 bg-slate-900/84 p-5 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
        <Navigation className="h-4 w-4 text-cyan-300" />
        Active route
      </div>
      <p className="text-lg font-semibold text-slate-100">{routeInfo.destinationName}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-slate-700/80 bg-slate-950/80 p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">ETA</div>
          <div className="mt-1 text-base font-semibold text-cyan-300">{routeInfo.durationText}</div>
        </div>
        <div className="rounded-md border border-slate-700/80 bg-slate-950/80 p-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Distance</div>
          <div className="mt-1 text-base font-semibold text-slate-200">{routeInfo.distanceText}</div>
        </div>
      </div>
      {Array.isArray(routeInfo.steps) && routeInfo.steps.length > 0 && (
        <div className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-md border border-slate-700/80 bg-slate-950/70 p-3">
          {routeInfo.steps.slice(0, 8).map((step) => (
            <div key={step.id} className="rounded-md border border-slate-700/70 bg-slate-900/70 p-2">
              <p className="text-sm font-medium text-slate-200">{step.description}</p>
              <p className="mt-1 text-xs text-slate-400">
                {step.type === 'TRANSIT' ? `${step.lineName} · ${step.numStops} stops` : step.type}
                {step.durationText ? ` · ${step.durationText}` : ''}
                {step.distanceText ? ` · ${step.distanceText}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onClearRoute}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-slate-100"
      >
        <X className="h-4 w-4" />
        Clear route
      </button>
    </div>
  );
}

export function ParkingControls({
  visible,
  parkingRadiusMeters,
  onRadiusChange,
  onRefresh,
  spotsCount,
}) {
  if (!visible) return null;

  return (
    <div className="pointer-events-auto rounded-[12px] border border-slate-700/80 bg-slate-900/84 p-4 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl">
      <div className="mb-2 text-sm font-semibold text-slate-100">Parking search</div>
      <div className="text-xs text-slate-400">Found {spotsCount} nearby spots</div>
      <div className="mt-3 flex items-center gap-3">
        <input
          type="range"
          min={200}
          max={2000}
          step={100}
          value={parkingRadiusMeters}
          onChange={(event) => onRadiusChange(Number(event.target.value))}
          className="w-full"
        />
        <span className="min-w-12 text-xs font-semibold text-cyan-300">{parkingRadiusMeters}m</span>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="mt-3 inline-flex items-center gap-2 rounded-md bg-cyan-400 px-3 py-2 text-xs font-medium text-slate-950 transition hover:bg-cyan-300"
      >
        Refresh
      </button>
    </div>
  );
}
