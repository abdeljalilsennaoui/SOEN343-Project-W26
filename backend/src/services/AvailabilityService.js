const Booking = require('../models/Booking');
const { BookingStatus } = require('../models/enums');

/**
 * Returns true if the option is available for [startTime, endTime].
 *
 * @param {object} option
 * @param {string} startTime - ISO datetime
 * @param {string} endTime - ISO datetime
 * @param {string} [excludeBookingId] - booking id to exclude from conflict check
 * @returns {Promise<boolean>}
 */
async function isAvailable(option, startTime, endTime, excludeBookingId) {
  const reqStart = new Date(startTime).getTime();
  const reqEnd = new Date(endTime).getTime();

  // Check hard-coded blocked periods on the option itself
  for (const period of option.blockedPeriods) {
    const blockStart = new Date(period.start).getTime();
    const blockEnd = new Date(period.end).getTime();
    if (reqStart < blockEnd && reqEnd > blockStart) {
      return false;
    }
  }

  // Check existing bookings that conflict
  const allBookings = await Booking.findAll();
  const conflicting = allBookings.filter((b) => {
    if (b.optionId !== option.id) return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.status !== BookingStatus.DRAFT && b.status !== BookingStatus.ACTIVE) return false;
    const bookStart = new Date(b.startTime).getTime();
    const bookEnd = new Date(b.endTime).getTime();
    return reqStart < bookEnd && reqEnd > bookStart;
  });

  return conflicting.length === 0;
}

module.exports = { isAvailable };
