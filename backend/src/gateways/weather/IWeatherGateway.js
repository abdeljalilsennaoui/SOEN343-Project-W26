/**
 * Weather Gateway Interface
 * Defines the contract for weather data services.
 * Implement this interface to integrate a real weather API.
 * Concrete gateways can decide how provider-specific responses are normalized before returning them.
 *
 * @interface IWeatherGateway
 * @method getCurrentWeather(city) - Get current weather for a city
 */
class IWeatherGateway {
  async getCurrentWeather(_city) {
    throw new Error('IWeatherGateway.getCurrentWeather() must be implemented');
  }
}

module.exports = IWeatherGateway;
