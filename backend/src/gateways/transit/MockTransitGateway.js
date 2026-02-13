const ITransitGateway = require('./ITransitGateway');

class MockTransitGateway extends ITransitGateway {
  async getSchedule(city, line = null) {
    const lines = line
      ? [{ line, type: 'BUS' }]
      : [
          { line: '24', type: 'BUS' },
          { line: '55', type: 'BUS' },
          { line: 'Green', type: 'METRO' },
          { line: 'Orange', type: 'METRO' },
        ];

    return lines.map((l) => ({
      city,
      line: l.line,
      type: l.type,
      nextArrivals: ['5 min', '12 min', '20 min'],
      status: 'On time',
    }));
  }

  async getNearbyStops(latitude, longitude) {
    return [
      { id: 'stop-1', name: 'Main St Station', distance: 0.2, latitude, longitude },
      { id: 'stop-2', name: 'Park Ave Stop', distance: 0.5, latitude: latitude + 0.003, longitude },
      { id: 'stop-3', name: 'University Station', distance: 0.8, latitude, longitude: longitude + 0.005 },
    ];
  }
}

module.exports = MockTransitGateway;
