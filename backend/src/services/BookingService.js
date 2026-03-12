const Booking = require('../models/Booking');
const PaymentReceipt = require('../models/PaymentReceipt');
const MobilityOption = require('../models/MobilityOption');
const AvailabilityService = require('./AvailabilityService');
const PricingService = require('./PricingService');
const { createPaymentGateway } = require('../gateways');
const ApiError = require('../models/ApiError');
const { BookingStatus, ReceiptStatus } = require('../models/enums');
const BookingStateMachine = require('../lib/BookingStateMachine');
const EventBus = require('../lib/EventBus');

// Strategy pattern: paymentGateway is resolved once via the factory.
// Swapping the implementation (mock → real) requires only changing gateways/index.js.
const paymentGateway = createPaymentGateway();

/**
 * Step A — Create a DRAFT booking.
 */
async function createDraft({ userId, optionId, startTime, endTime, pickupLocation }) {
  const option = await MobilityOption.findById(optionId);
  if (!option) {
    throw new ApiError('OPTION_NOT_FOUND', `Mobility option ${optionId} not found`, 404);
  }

  if (!(await AvailabilityService.isAvailable(option, startTime, endTime))) {
    throw new ApiError(
      'BOOKING_NOT_AVAILABLE',
      'Selected option is not available for the requested time window.',
      409,
    );
  }

  const totalPrice = PricingService.calculatePrice(option, startTime, endTime);
  const draft = await Booking.create({ userId, optionId, startTime, endTime, pickupLocation, totalPrice });

  EventBus.emit('RESERVATION_CREATED', {
    city: option.city,
    metadata: { vehicleType: option.type, optionId, userId },
  });

  return draft;
}

/**
 * Step B — Confirm a DRAFT booking and process payment.
 * Uses BookingStateMachine to validate the DRAFT → ACTIVE transition.
 */
async function confirmDraft(draftId, userId, paymentDetails) {
  const booking = await Booking.findById(draftId);
  if (!booking) {
    throw new ApiError('BOOKING_NOT_FOUND', `Booking ${draftId} not found`, 404);
  }

  if (booking.userId !== userId) {
    throw new ApiError('FORBIDDEN', 'You are not authorized to confirm this booking.', 403);
  }

  // State pattern: asserts DRAFT → ACTIVE is a valid transition; throws 409 otherwise
  BookingStateMachine.transition(booking, BookingStatus.ACTIVE);

  const option = await MobilityOption.findById(booking.optionId);
  if (!option || !(await AvailabilityService.isAvailable(option, booking.startTime, booking.endTime, draftId))) {
    throw new ApiError(
      'BOOKING_NOT_AVAILABLE',
      'Selected option is no longer available for the requested time window.',
      409,
    );
  }

  const gatewayResult = await paymentGateway.charge(booking.totalPrice, paymentDetails);

  if (!gatewayResult.success) {
    await Booking.update(draftId, { status: BookingStatus.FAILED });
    await PaymentReceipt.create({
      bookingId: draftId,
      amount: booking.totalPrice,
      providerRef: gatewayResult.transactionId,
      status: ReceiptStatus.FAILED,
    });
    throw new ApiError('PAYMENT_FAILED', gatewayResult.message || 'Payment was declined.', 402);
  }

  const updatedBooking = await Booking.update(draftId, { status: BookingStatus.ACTIVE });
  const receipt = await PaymentReceipt.create({
    bookingId: draftId,
    amount: booking.totalPrice,
    providerRef: gatewayResult.transactionId,
    status: ReceiptStatus.SUCCESS,
  });

  EventBus.emit('BOOKING_CONFIRMED', {
    city: option.city,
    metadata: { bookingId: draftId, type: option.type, amount: booking.totalPrice },
  });
  EventBus.emit('PAYMENT_PROCESSED', {
    city: option.city,
    metadata: { bookingId: draftId, amount: booking.totalPrice, transactionId: gatewayResult.transactionId },
  });

  return { booking: updatedBooking, receipt };
}

/**
 * Step C — Mark a booking COMPLETE (idempotent).
 * Uses BookingStateMachine to validate the ACTIVE → COMPLETE transition.
 */
async function completeBooking(bookingId, userId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError('BOOKING_NOT_FOUND', `Booking ${bookingId} not found`, 404);
  }

  if (booking.userId !== userId) {
    throw new ApiError('FORBIDDEN', 'You are not authorized to complete this booking.', 403);
  }

  // Idempotent: already complete is fine
  if (booking.status === BookingStatus.COMPLETE) {
    return booking;
  }

  // State pattern: asserts ACTIVE → COMPLETE is valid; throws 409 otherwise
  BookingStateMachine.transition(booking, BookingStatus.COMPLETE);

  return Booking.update(bookingId, { status: BookingStatus.COMPLETE });
}

/**
 * Returns all bookings belonging to a user.
 * Information Expert: BookingService owns booking retrieval logic.
 */
async function getMyBookings(userId) {
  return Booking.findByUserId(userId);
}

module.exports = { createDraft, confirmDraft, completeBooking, getMyBookings };
