/**
 * @typedef {Object} WeatherState
 * @property {string} condition
 * @property {number} temperature
 * @property {string} observedAt - ISO date string
 */

function createWeatherState({ condition, temperature, observedAt }) {
  return { condition, temperature, observedAt };
}

module.exports = { createWeatherState };
