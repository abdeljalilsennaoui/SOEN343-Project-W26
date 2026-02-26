const Booking = require('../models/Booking');
const PaymentReceipt = require('../models/PaymentReceipt');
const MobilityOption = require('../models/MobilityOption');
const AvailabilityService = require('./AvailabilityService');
const PricingService = require('./PricingService');
const { createPaymentGateway } = require('../gateways');
const ApiError = require('../models/ApiError');
const { BookingStatus, ReceiptStatus } = require('../models/enums');

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
  return Booking.create({ userId, optionId, startTime, endTime, pickupLocation, totalPrice });
}

/**
 * Step B — Confirm a DRAFT booking and process payment.
 */
async function confirmDraft(draftId, userId, paymentDetails) {
  const booking = await Booking.findById(draftId);
  if (!booking) {
    throw new ApiError('BOOKING_NOT_FOUND', `Booking ${draftId} not found`, 404);
  }

  if (booking.userId !== userId) {
    throw new ApiError('FORBIDDEN', 'You are not authorized to confirm this booking.', 403);
  }

  if (booking.status !== BookingStatus.DRAFT) {
    throw new ApiError(
      'DRAFT_INVALID_STATE',
      `Booking is not in DRAFT state (current: ${booking.status}).`,
      409,
    );
  }

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

  return { booking: updatedBooking, receipt };
}

/**
 * Step C — Mark a booking COMPLETE (idempotent).
 * Ownership check: only the booking owner can complete it.
 */
async function completeBooking(bookingId, userId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError('BOOKING_NOT_FOUND', `Booking ${bookingId} not found`, 404);
  }

  if (booking.userId !== userId) {
    throw new ApiError('FORBIDDEN', 'You are not authorized to complete this booking.', 403);
  }

  if (booking.status === BookingStatus.COMPLETE) {
    return booking;
  }

  if (booking.status !== BookingStatus.ACTIVE) {
    throw new ApiError(
      'DRAFT_INVALID_STATE',
      `Cannot complete booking with status ${booking.status}. Booking must be ACTIVE.`,
      409,
    );
  }

  return Booking.update(bookingId, { status: BookingStatus.COMPLETE });
}

module.exports = { createDraft, confirmDraft, completeBooking };
