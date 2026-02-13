/**
 * @typedef {Object} PublicTransport
 * @property {string} id
 * @property {string} type - BUS, METRO, or TRAM
 * @property {string} cityId
 */

/**
 * @typedef {Object} StopOrStation
 * @property {string} id
 * @property {string} name
 */

function createPublicTransport({ id, type, cityId }) {
  return { id, type, cityId };
}

function createStopOrStation({ id, name }) {
  return { id, name };
}

module.exports = { createPublicTransport, createStopOrStation };
