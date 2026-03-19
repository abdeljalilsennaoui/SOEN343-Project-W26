import { ChevronDown, LocateFixed, Sparkles, X } from 'lucide-react';

export default function MapHero({
  isCollapsed,
  onExpand,
  onCollapse,
  onUseMyLocation,
  dataset,
  onDatasetChange,
  datasetSummary,
  addressInput,
  onAddressChange,
  onAddressKeyDown,
  onSearch,
  mapReady,
}) {
  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="pointer-events-auto inline-flex w-fit items-center gap-3 rounded-full border border-white/70 bg-white/85 px-5 py-3 text-sm font-medium text-slate-800 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
        aria-expanded="false"
        aria-label="Expand Explore Montreal panel"
      >
        <Sparkles className="h-4 w-4 text-indigo-500" />
        Explore
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>
    );
  }

  return (
    <div className="pointer-events-auto w-full max-w-2xl rounded-md border border-white/65 bg-white/78 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl md:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-[2rem]">
                      Explore the best mobility options
                    </h1>
                  </div>
                  <button
                    type="button"
                    onClick={onCollapse}
                    className="rounded-full border border-slate-200 bg-white/70 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    aria-label="Close selected location"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onUseMyLocation}
                className="inline-flex items-center gap-2 rounded-md border border-white/70 bg-white/75 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              >
                <LocateFixed className="h-4 w-4" />
                My location
              </button>
              <div className="flex rounded-md border border-white/70 bg-white/75 shadow-sm">
                <button
                  type="button"
                  onClick={() => onDatasetChange('RENTALS')}
                  className={`rounded-md px-4 py-3 text-sm font-medium transition ${
                    dataset === 'RENTALS'
                      ? 'bg-slate-950 text-white shadow-md shadow-slate-900/15'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rentals
                </button>
                <button
                  type="button"
                  onClick={() => onDatasetChange('PARKING')}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                    dataset === 'PARKING'
                      ? 'bg-slate-950 text-white shadow-md shadow-slate-900/15'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Parking
                </button>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">
              Search an address, switch between rental mobility and parking, then preview the best next stop with live route and draft-booking actions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:min-w-[300px]">
          {datasetSummary.map((item) => (
            <div key={item.label} className="rounded-lg border border-white/70 bg-white/70 p-4 text-center shadow-sm">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 md:text-base">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            type="text"
            value={addressInput}
            onChange={onAddressChange}
            onKeyDown={onAddressKeyDown}
            placeholder="Search address in Montreal…"
            className={`px-4 w-full py-2.5 border border-gray-300 rounded-md text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black-500/50 focus:border-black-500 transition ${
              mapReady ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
            }`}
          />
          <button
            type="button"
            onClick={onSearch}
            className="hidden rounded-md bg-slate-950 px-4 py-2 text-lg font-medium text-white transition hover:bg-slate-800 md:inline-flex"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
