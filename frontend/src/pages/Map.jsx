import MapHero from '../components/map/MapHero';
import { MapBookingStatus, MapRouteInfo } from '../components/map/MapFeedback';
import SelectedLocationCard from '../components/map/SelectedLocationCard';
import { useMap } from '../hooks/useMap';
import { useMapUi } from '../hooks/useMapUi';

export default function MapPage() {

  const {
    mapContainerId,
    dataset,
    setDataset,
    addressInput,
    setAddressInput,
    routeInfo,
    bookingStatus,
    setBookingStatus,
    mapReady,
    mapError,
    selectedLocation,
    setSelectedLocation,
    backendAvailable,
    isHeroCollapsed,
    setIsHeroCollapsed,
    onSearchAddress,
    onUseMyLocation,
    onClearRoute,
    handleRouteToLocation,
    handleBooking,
  } = useMap();

  const { datasetSummary } = useMapUi(dataset, backendAvailable);

  if (mapError) {
    return (
      <div className="flex h-64 items-center justify-center px-4 text-sm text-red-600">
        {mapError}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-71px)] bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <div className="relative h-full min-h-[720px] overflow-hidden border border-white/70 bg-slate-950 shadow-[0_30px_120px_rgba(15,23,42,0.18)]">
        <div id={mapContainerId} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.18),transparent_22%,transparent_70%,rgba(15,23,42,0.26))]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_62%)]" />

        {!mapReady && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px]">
            <div className="rounded-[28px] border border-white/60 bg-white/85 px-6 py-5 text-center shadow-2xl backdrop-blur-xl">
              <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full bg-slate-900" />
              <p className="text-sm font-medium text-slate-900">Loading immersive city map…</p>
              <p className="mt-1 text-xs text-slate-500">Preparing live routing and mobility layers.</p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <MapHero
              isCollapsed={isHeroCollapsed}
              onExpand={() => setIsHeroCollapsed(false)}
              onCollapse={() => setIsHeroCollapsed(true)}
              onUseMyLocation={onUseMyLocation}
              dataset={dataset}
              onDatasetChange={setDataset}
              datasetSummary={datasetSummary}
              addressInput={addressInput}
              onAddressChange={(event) => setAddressInput(event.target.value)}
              onAddressKeyDown={(event) => event.key === 'Enter' && onSearchAddress()}
              onSearch={onSearchAddress}
              mapReady={mapReady}
            />
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-4 xl:max-w-sm">
              <MapBookingStatus
                bookingStatus={bookingStatus}
                onDismiss={() => setBookingStatus(null)}
              />
              <MapRouteInfo routeInfo={routeInfo} onClearRoute={onClearRoute} />
            </div>

            <SelectedLocationCard
              location={selectedLocation}
              backendAvailable={backendAvailable}
              onClose={() => setSelectedLocation(null)}
              onRoute={() => handleRouteToLocation(selectedLocation)}
              onBook={() => handleBooking(selectedLocation)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
