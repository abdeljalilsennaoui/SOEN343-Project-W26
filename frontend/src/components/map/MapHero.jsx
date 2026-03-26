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
        className="pointer-events-auto inline-flex w-fit items-center gap-3 rounded-full border border-cyan-400/30 bg-slate-900/85 px-5 py-3 text-sm font-medium text-slate-200 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-slate-900"
        aria-expanded="false"
        aria-label="Expand Explore Montreal panel"
      >
        <Sparkles className="h-4 w-4 text-cyan-300" />
        Explore
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
    );
  }

  return (
    <div className="pointer-events-auto w-full max-w-2xl rounded-md border border-slate-700/90 bg-slate-900/80 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.5)] backdrop-blur-xl md:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-100 md:text-[2rem]">
                      Explore the best mobility options
                    </h1>
                  </div>
                  <button
                    type="button"
                    onClick={onCollapse}
                    className="rounded-full border border-slate-700 bg-slate-900/70 p-2 text-slate-400 transition hover:border-slate-600 hover:text-slate-200"
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
                className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <LocateFixed className="h-4 w-4" />
                My location
              </button>
              <div className="flex rounded-md border border-slate-700 bg-slate-900/70 shadow-sm">
                <button
                  type="button"
                  onClick={() => onDatasetChange('RENTALS')}
                  className={`rounded-md px-4 py-3 text-sm font-medium transition ${
                    dataset === 'RENTALS'
                      ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-900/20'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Rentals
                </button>
                <button
                  type="button"
                  onClick={() => onDatasetChange('PARKING')}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                    dataset === 'PARKING'
                      ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-900/20'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Parking
                </button>
                <button
                  type="button"
                  onClick={() => onDatasetChange('TRANSIT')}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                    dataset === 'TRANSIT'
                      ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-900/20'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Transit
                </button>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-[15px]">
              Search an address, switch between rentals, parking, and transit stops, then preview the best next stop with route and contextual actions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:min-w-[300px]">
          {datasetSummary.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-4 text-center shadow-sm">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
              <div className="mt-1 text-sm font-semibold text-cyan-300 md:text-base">{item.value}</div>
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
            className={`px-4 w-full py-2.5 border border-slate-700 rounded-md text-slate-100 bg-slate-950/70 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 transition ${
              mapReady ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
            }`}
          />
          <button
            type="button"
            onClick={onSearch}
            className="hidden rounded-md bg-cyan-400 px-4 py-2 text-lg font-medium text-slate-950 transition hover:bg-cyan-300 md:inline-flex"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
