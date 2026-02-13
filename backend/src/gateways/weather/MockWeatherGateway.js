const IWeatherGateway = require('./IWeatherGateway');

const MOCK_WEATHER = {
  Montreal: { condition: 'Snowy', temperature: -8 },
  Toronto: { condition: 'Cloudy', temperature: 2 },
  Vancouver: { condition: 'Rainy', temperature: 10 },
};

class MockWeatherGateway extends IWeatherGateway {
  async getCurrentWeather(city) {
    const weather = MOCK_WEATHER[city] || { condition: 'Sunny', temperature: 20 };
    return {
      condition: weather.condition,
      temperature: weather.temperature,
      observedAt: new Date().toISOString(),
    };
  }
}

module.exports = MockWeatherGateway;
