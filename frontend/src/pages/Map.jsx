import { useMemo, useState } from 'react';
import { geocodeAddress } from '../services/googleApiAdapter';
import { useMap } from '../hooks/useMap';
import RideSharingModal from '../components/RideSharingModal';
import { DEFAULT_PARKING_RADIUS_METERS } from '@/utils/constants';

export default function MapPage() {
  const [activeTab, setActiveTab] = useState('route');

  const {
    mapContainerId,
    dataset,
    setDataset,
    addressInput,
    setAddressInput,
    setDestinationInput,
    destinationInput,
    routeInfo,
    mapReady,
    mapError,
    originLabel,
    destinationLabel,
    mapClickMode,
    selectedLocation,
    setSelectedLocation,
    parkingSpots,
    refreshParkingSpots,
    isHeroCollapsed,
    setIsHeroCollapsed,
    onSearchAddress,
    onUseMyLocation,
    onClearRoute,
    onStartMapPick,
    resetMap,
    activeBookings,
    bookingStatus,
    setBookingStatus,
    calculateTransitRoute,
    handleRouteToLocation,
    pendingBooking,
    confirmPendingBooking,
    cancelPendingBooking,
  } = useMap();

  const routeSummary = useMemo(() => {
    if (!routeInfo) return null;

    const transitSteps = (routeInfo.steps ?? []).filter((step) => step.type === 'TRANSIT').length;
    const minsMatch = /\d+/.exec(routeInfo.durationText || '');

    return {
      duration: minsMatch ? `${minsMatch[0]} min` : routeInfo.durationText,
      distance: routeInfo.distanceText,
      lines: `${transitSteps} line${transitSteps > 1 ? 's' : ''}`,
    };
  }, [routeInfo]);

  const onCalculateRoute = async () => {
    const target = destinationInput.trim();
    if (!target && !selectedLocation) {
      alert('Enter a destination or select a point on the map.');
      return;
    }

    try {
      if (target) {
        const latLng = await geocodeAddress(target);
        if (dataset === 'PARKING') {
          await handleRouteToLocation({
            lat: latLng.lat,
            lng: latLng.lng,
            name: target,
            type: 'PARKING',
          });
        } else {
          await calculateTransitRoute({ lat: latLng.lat, lng: latLng.lng }, target);
        }
        setDestinationInput(target);
      } else if (selectedLocation) {
        if (dataset === 'PARKING') {
          await handleRouteToLocation(selectedLocation);
        } else {
          await calculateTransitRoute({ lat: selectedLocation.lat, lng: selectedLocation.lng }, selectedLocation.name);
        }
        setDestinationInput(selectedLocation.name);
      }

      setActiveTab(dataset === 'PARKING' ? 'parking' : 'route');
    } catch (error) {
      alert(`Unable to calculate route: ${error.message}`);
    }
  };

  const onReset = () => {
    resetMap();
    setActiveTab('route');
  };

  if (mapError) {
    return (
      <div className="flex h-64 items-center justify-center px-4 text-sm text-red-600">
        {mapError}
      </div>
    );
  }

  return (
    <div className="bg-[#0d0f14] text-[#e8eaf0]">
      <header className="border-b border-[#1e2330] bg-[#13161d] px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-mono-ui mr-2 text-xs font-bold tracking-[0.14em] text-gray-200">SEARCH</div>
          <input
            type="text"
            value={addressInput}
            onChange={(event) => setAddressInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onSearchAddress()}
            placeholder="Origin (address)"
            className="min-w-[220px] flex-1 rounded-md border border-gray-600 bg-[#0d0f14] px-3 py-2 text-sm text-[#e8eaf0] placeholder-gray-500 transition-colors focus:border-gray-300 focus:outline-none"
          />
          <input
            type="text"
            value={destinationInput}
            onChange={(event) => setDestinationInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onCalculateRoute()}
            placeholder="Destination (address or map point)"
            className="min-w-[220px] flex-1 rounded-md border border-gray-600 bg-[#0d0f14] px-3 py-2 text-sm text-[#e8eaf0] placeholder-gray-500 transition-colors focus:border-gray-300 focus:outline-none"
          />
          <button
            type="button"
            onClick={onCalculateRoute}
            className="font-mono-ui rounded-md bg-gray-100 px-4 py-2 text-xs font-bold tracking-wide text-black transition-colors hover:bg-white active:bg-gray-300"
          >
            Route
          </button>
          <button
            type="button"
            onClick={onReset}
            className="font-mono-ui rounded-md border border-gray-500 px-4 py-2 text-xs tracking-wide text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => onStartMapPick('origin')}
            className={`font-mono-ui rounded-md border px-3 py-2 text-xs tracking-wide transition-colors ${mapClickMode === 'origin' ? 'border-gray-200 bg-white/10 text-gray-100' : 'border-gray-500 text-gray-300 hover:border-gray-400 hover:text-white'
              }`}
          >
            Pick origin (map)
          </button>
          <button
            type="button"
            onClick={() => onStartMapPick('destination')}
            className={`font-mono-ui rounded-md border px-3 py-2 text-xs tracking-wide transition-colors ${mapClickMode === 'destination' ? 'border-gray-200 bg-white/10 text-gray-100' : 'border-gray-500 text-gray-300 hover:border-gray-400 hover:text-white'
              }`}
          >
            Pick destination (map)
          </button>
          <button
            type="button"
            onClick={() => {
              setDataset('RENTALS');
              setActiveTab('rentals');
            }}
            className={`font-mono-ui rounded-md border px-4 py-2 text-xs tracking-wide transition-colors ${dataset === 'RENTALS' ? 'border-gray-200 bg-white/10 text-gray-100' : 'border-gray-500 text-gray-300 hover:border-gray-400 hover:text-white'
              }`}
          >
            Rentals
          </button>
          <button
            type="button"
            onClick={() => {
              setDataset('TRANSIT');
              setActiveTab('route');
            }}
            className={`font-mono-ui rounded-md border px-4 py-2 text-xs tracking-wide transition-colors ${dataset === 'TRANSIT' ? 'border-gray-200 bg-white/10 text-gray-100' : 'border-gray-500 text-gray-300 hover:border-gray-400 hover:text-white'
              }`}
          >
            Transit
          </button>
          <button
            type="button"
            onClick={() => {
              setDataset('PARKING');
              setActiveTab('parking');
              refreshParkingSpots();
            }}
            className={`font-mono-ui rounded-md border px-4 py-2 text-xs tracking-wide transition-colors ${dataset === 'PARKING' ? 'border-gray-200 bg-white/10 text-gray-100' : 'border-gray-500 text-gray-300 hover:border-gray-400 hover:text-white'
              }`}
          >
            Parking
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-132px)]">
        <aside className="flex w-[340px] flex-col border-r border-[#1e2330] bg-[#13161d] sidebar-scroll">
          <div className="flex items-center justify-between border-b border-[#1e2330] px-4 py-3">
            <span className="font-mono-ui text-[11px] tracking-[0.12em] text-[#5a6070]">NAVIGATION</span>
            <button
              type="button"
              onClick={onUseMyLocation}
              className="font-mono-ui rounded-md border border-gray-500 px-2.5 py-1.5 text-[10px] tracking-wide text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
            >
              My location
            </button>
          </div>

          <div className="flex border-b border-[#1e2330]">
            <button
              type="button"
              onClick={() => setActiveTab('route')}
              className={`font-mono-ui flex-1 border-b-2 px-3 py-2.5 text-[10px] tracking-[0.09em] transition-colors ${activeTab === 'route' ? 'border-gray-200 text-gray-100' : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
            >
              Route
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('parking')}
              className={`font-mono-ui flex-1 border-b-2 px-3 py-2.5 text-[10px] tracking-[0.09em] transition-colors ${activeTab === 'parking' ? 'border-gray-200 text-gray-100' : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
            >
              Parking ({parkingSpots?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className={`font-mono-ui flex-1 border-b-2 px-3 py-2.5 text-[10px] tracking-[0.09em] transition-colors ${activeTab === 'bookings' ? 'border-gray-200 text-gray-100' : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
            >
              Bookings{activeBookings.length > 0 ? ` (${activeBookings.length})` : ''}
            </button>
          </div>

          {activeTab === 'route' && (
            <>
              {mapClickMode && (
                <div className="border-b border-[#1e2330] bg-white/5 px-4 py-2 text-xs text-gray-200">
                  {mapClickMode === 'origin'
                    ? 'Click on the map to set ORIGIN'
                    : 'Click on the map to set DESTINATION'}
                </div>
              )}
              <div className="border-b border-[#1e2330] px-4 py-3 text-sm text-[#e8eaf0]">
                <div className="mb-3 flex items-center gap-3 rounded-md border border-gray-500/40 bg-white/5 px-3 py-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300/40 bg-gray-100/80 text-xs font-bold text-black">
                    A
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[#5a6070]">Origin</div>
                    <div className="truncate">{originLabel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-md border border-gray-500/40 bg-white/5 px-3 py-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300/40 bg-gray-400/70 text-xs font-bold text-black">
                    B
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[#5a6070]">Destination</div>
                    <div className="truncate">{destinationLabel || selectedLocation?.name || destinationInput || 'Select a destination'}</div>
                  </div>
                </div>
              </div>

              {routeSummary && (
                <div className="border-b border-[#1e2330] bg-white/5 px-4 py-3">
                  <div className="font-mono-ui mb-2 text-[10px] tracking-[0.1em] text-[#5a6070]">TRANSIT SUMMARY</div>
                  <div className="flex gap-4 text-sm">
                    <span>{routeSummary.duration}</span>
                    <span>{routeSummary.distance}</span>
                    <span>{routeSummary.lines}</span>
                  </div>
                </div>
              )}


              <div className="flex-1 overflow-y-auto px-4 py-4">
                {!routeInfo?.steps?.length ? (
                  <div className="pt-8 text-center text-sm text-[#5a6070]">
                    Choose an origin and destination to view the transit route.
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex gap-4 mb-2">
                      <div className="gap-4 items-center">
                        <div className="flex h-8 w-8 rounded-full bg-transparent border-2 border-white p-4 shrink-0 items-center justify-center">
                          B
                        </div>
                        <div className="w-0.5 h-10 ml-[16px]" style={{
                          background: 'repeating-linear-gradient(to bottom, #5a6070 0px, #5a6070 6px, transparent 6px, transparent 12px)'
                        }} />
                      </div>
                      <div className="text-sm text-[#e8eaf0]">{originLabel}</div>
                    </div>
                    {routeInfo.steps.map((step, index) => (
                      <div key={step.id} className="relative flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${step.type === 'TRANSIT'
                            ? 'border-white bg-[#13161d]'
                            : 'border-[#5a6070] bg-[#13161d]'
                            }`}>
                            {step.type === 'WALKING' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
                                <g transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
                                  <path d="M 55.044 90 c -1.217 0 -2.387 -0.415 -3.347 -1.198 c -1.127 -0.918 -1.815 -2.222 -1.939 -3.671 l -1.603 -20.142 c -0.065 -0.907 -0.497 -1.76 -1.184 -2.346 L 36.514 53.72 c -1.866 -1.592 -2.807 -3.996 -2.519 -6.431 l 1.762 -14.868 l -2.105 1.357 c -0.712 0.459 -1.179 1.204 -1.282 2.044 l -1.079 8.801 c -0.317 2.581 -2.677 4.432 -5.257 4.132 c -1.262 -0.147 -2.39 -0.779 -3.176 -1.779 c -0.785 -0.999 -1.133 -2.245 -0.978 -3.506 l 1.52 -12.399 c 0.246 -2.009 1.38 -3.762 3.112 -4.81 l 9.54 -5.771 c 1.987 -1.202 4.347 -1.678 6.643 -1.346 l 3.988 0.581 c 2.193 0.319 3.707 2.294 3.446 4.496 L 47.5 46.412 c -0.086 0.729 0.196 1.449 0.755 1.926 l 8.4 7.168 c 1.252 1.069 2.038 2.624 2.157 4.266 l 1.926 24.425 c 0.24 2.868 -1.815 5.384 -4.68 5.723 h -0.001 l -0.377 0.044 C 55.468 89.987 55.255 90 55.044 90 z" fill="white" />
                                  <path d="M 63.423 46.153 c -0.051 0 -0.102 -0.001 -0.152 -0.002 c -1.27 -0.04 -2.448 -0.573 -3.316 -1.502 l -8.351 -8.941 c -0.208 -0.223 -0.304 -0.527 -0.259 -0.829 l 1.398 -9.463 c 0.056 -0.38 0.325 -0.694 0.691 -0.809 c 0.365 -0.115 0.768 -0.009 1.028 0.272 l 12.42 13.297 c 1.775 1.9 1.682 4.897 -0.209 6.683 C 65.786 45.697 64.637 46.153 63.423 46.153 z" fill="white" />
                                  <path d="M 47.295 17.771 c -4.899 0 -8.885 -3.986 -8.885 -8.886 S 42.396 0 47.295 0 s 8.886 3.986 8.886 8.886 S 52.195 17.771 47.295 17.771 z" fill="white" />
                                  <path d="M 32.461 90 c -0.341 0 -0.685 -0.033 -1.027 -0.1 c -2.832 -0.55 -4.727 -3.309 -4.225 -6.149 l 0 0 l 4.979 -28.135 c 0.062 -0.351 0.306 -0.642 0.64 -0.765 c 0.335 -0.122 0.708 -0.059 0.982 0.168 l 7.628 6.304 c 0.277 0.229 0.41 0.589 0.348 0.943 l -4.097 23.332 c -0.249 1.418 -1.039 2.647 -2.226 3.464 C 34.565 89.68 33.526 90 32.461 90 z" fill="white" />
                                </g>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                                <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
                              </svg>
                            )}
                          </div>
                          {index < routeInfo.steps.length && (
                            <div className={`w-0.5 flex-1 my-1 ml-[1px] ${step.type === 'TRANSIT' ? 'bg-white' : 'bg-dashed bg-[#5a6070]'
                              }`}
                              style={step.type === 'WALKING' ? {
                                background: 'repeating-linear-gradient(to bottom, #5a6070 0px, #5a6070 6px, transparent 6px, transparent 12px)'
                              } : {}}
                            />
                          )}
                        </div>

                        <div className="pb-6 pt-1 flex-1 min-w-0">
                          {step.type === 'WALKING' ? (
                            <div>
                              <div className="text-sm text-[#e8eaf0]">{step.description} Walking</div>
                              <div className="mt-0.5 text-xs text-[#5a6070]">
                                {step.durationText && `${step.durationText}`}
                                {step.distanceText && ` · ${step.distanceText}`}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {step.lineName && (
                                  <span className="rounded px-1.5 py-0.5 text-xs font-bold text-white bg-[#1e2330] border border-white/20">
                                    {step.lineName}
                                  </span>
                                )}
                                <span className="text-sm text-[#e8eaf0] truncate">{step.description}</span>
                              </div>
                              <div className="mt-0.5 text-xs text-[#5a6070]">
                                {step.numStops && `${step.numStops} stops`}
                                {step.durationText && ` · ${step.durationText}`}
                                {step.distanceText && ` · ${step.distanceText}`}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-4 items-center mt-1">
                      <div className="flex h-8 w-8 rounded-full bg-transparent border-2 border-white p-4 shrink-0 items-center justify-center">
                        B
                      </div>
                      <div className="text-sm text-[#e8eaf0]">
                        {destinationInput}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'parking' && (
            <>
              <div className="border-b border-[#1e2330] px-4 py-3 flex items-center justify-between">
                <span className="font-mono-ui text-[10px] tracking-[0.1em] text-[#5a6070]">
                  NEARBY PARKING · {DEFAULT_PARKING_RADIUS_METERS}m
                </span>
                <button
                  type="button"
                  onClick={refreshParkingSpots}
                  className="font-mono-ui rounded-md border border-gray-500 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
                >
                  Refresh
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                {!parkingSpots.length ? (
                  <div className="pt-8 text-center text-sm text-[#5a6070]">No nearby parking found.</div>
                ) : (
                  <div className="space-y-2">
                    {parkingSpots.map((spot) => (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => {
                          handleRouteToLocation(spot);
                          setDestinationInput(spot.facilityName);
                        }}
                        className="w-full rounded-md border border-gray-700 bg-[#0d0f14] px-3 py-2.5 text-left transition-colors hover:border-gray-500 hover:bg-white/5"
                      >
                        <div className="truncate text-sm text-[#e8eaf0]">{spot.facilityName}</div>
                        <div className="mt-1 text-xs text-[#5a6070]">
                          {spot.distanceMeters < 1000
                            ? `${Math.round(spot.distanceMeters)}m`
                            : `${(spot.distanceMeters / 1000).toFixed(1)}km`}
                          {spot.notes ? ` · ${spot.notes}` : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'bookings' && (
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {!activeBookings.length ? (
                <div className="pt-8 text-center text-sm text-[#5a6070]">
                  No active bookings. Book a ride from the <a href="/book" className="text-gray-300 underline hover:text-white">Book page</a> or click a pin.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-md border border-[#1e2330] bg-[#0d0f14] px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#e8eaf0]">{booking.id.slice(0, 8)}…</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          booking.status === 'ACTIVE' ? 'bg-blue-500/15 text-blue-400' : 'bg-yellow-500/15 text-yellow-400'
                        }`}>{booking.status}</span>
                      </div>
                      <div className="text-xs text-[#5a6070]">
                        {new Date(booking.startTime).toLocaleString()} → {new Date(booking.endTime).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        ${booking.totalPrice?.toFixed(2)} · {booking.optionId?.slice(0, 8)}…
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        <div className="relative flex-1">
          <div id={mapContainerId} className="absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.28),transparent_28%,transparent_72%,rgba(2,6,23,0.35))]" />

          {bookingStatus && (
            <div className={`absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${
              bookingStatus.ok
                ? 'border-green-500/40 bg-green-900/80 text-green-200'
                : 'border-red-500/40 bg-red-900/80 text-red-200'
            }`}>
              <div className="flex items-center gap-3">
                <span>{bookingStatus.ok ? 'Booked' : 'Failed'}: {bookingStatus.message}</span>
                <button
                  type="button"
                  onClick={() => setBookingStatus(null)}
                  className="ml-2 text-xs opacity-60 hover:opacity-100"
                >✕</button>
              </div>
            </div>
          )}

          {!mapReady && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/45 backdrop-blur-[2px]">
              <div className="rounded-[20px] border border-gray-400/30 bg-slate-900/90 px-6 py-5 text-center shadow-2xl backdrop-blur-xl">
                <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full bg-gray-300/80" />
                <p className="text-sm font-medium text-slate-100">Loading immersive city map…</p>
                <p className="mt-1 text-xs text-slate-400">Preparing live routing and mobility layers.</p>
              </div>
            </div>
          )}

          {isHeroCollapsed ? null : (
            <button
              type="button"
              onClick={() => setIsHeroCollapsed(true)}
              className="absolute right-4 top-4 z-20 rounded-md border border-gray-500 bg-[#13161d]/90 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
            >
              Hide overlay
            </button>
          )}
          {selectedLocation && (
            <div className="absolute bottom-4 right-4 z-20 max-w-xs rounded-md border border-gray-600 bg-[#13161d]/95 p-3 text-sm shadow-lg">
              <div className="font-semibold text-[#e8eaf0]">{selectedLocation.name}</div>
              <div className="mt-1 text-xs text-gray-400">{selectedLocation.notes || 'Selected point'}</div>
              <button
                type="button"
                onClick={() => setSelectedLocation(null)}
                className="mt-2 rounded-md border border-gray-500 px-2.5 py-1 text-xs text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
      {pendingBooking && (
        <RideSharingModal
          option={pendingBooking.option}
          onConfirm={confirmPendingBooking}
          onCancel={cancelPendingBooking}
        />
      )}
    </div>
  );
}
