
function stripHtml(html = '') {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeRouteSteps(googleSteps = []) {
  return googleSteps.map((step, index) => {
    if (step.travel_mode === 'TRANSIT' && step.transit) {
      const line = step.transit.line ?? {};
      return {
        id: `step-${index}`,
        type: 'TRANSIT',
        description: `${step.transit.departure_stop?.name ?? 'Departure'} → ${step.transit.arrival_stop?.name ?? 'Arrival'}`,
        distanceText: step.distance?.text ?? '',
        durationText: step.duration?.text ?? '',
        lineName: line.short_name || line.name || 'Transit',
        headsign: step.transit.headsign ?? '',
        numStops: step.transit.num_stops ?? 0,
        stops: (step.transit.stops ?? []).map((stop) => stop.name),
      };
    }

    return {
      id: `step-${index}`,
      type: step.travel_mode || 'WALKING',
      description: stripHtml(step.html_instructions || 'Continue'),
      distanceText: step.distance?.text ?? '',
      durationText: step.duration?.text ?? '',
    };
  });
}

export default normalizeRouteSteps;