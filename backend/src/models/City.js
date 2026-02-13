/**
 * @typedef {Object} City
 * @property {string} id
 * @property {string} name
 */

function createCity({ id, name }) {
  return { id, name };
}

module.exports = { createCity };
