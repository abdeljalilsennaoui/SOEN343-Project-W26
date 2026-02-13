/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} role - UserRole enum value
 */

/**
 * @typedef {User} Commuter - Makes reservations, takes trips
 * @typedef {User} SystemAdministrator - Full system access
 * @typedef {User} CityAdministrator - Views analytics
 */

function createUser({ id, name, email, role }) {
  return { id, name, email, role };
}

module.exports = { createUser };
