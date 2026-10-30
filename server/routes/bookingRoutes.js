const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Quotation = require('../models/Quotation');
const EventRequest = require('../models/EventRequest');
const { authenticate, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const {
  isObjectId,
  isPlainObject,
  parseListLimit,
  sendBoundedList,
  parsePagination,
  sendPaginatedList
} = require('../utils/httpValidation');

const router = express.Router();

const createBookingId = () => `PJTHB-${Math.floor(1000 + Math.random() * 9000)}`;

const bookingMatchesRequestAndQuotation = (booking, request, quotation) => Boolean(
  booking
  && booking.request.toString() === request._id.toString()
  && booking.customer.toString() === request.user.toString()
  && booking.quotation
  && booking.quotation.toString() === quotation._id.toString()
  && quotation.request.toString() === request._id.toString()
  && quotation.customer.toString() === request.user.toString()
);

const createPendingBookingData = (request, quotation, bookingId) => ({
  bookingId,
  customer: request.user,
  request: request._id,
  quotation: quotation._id,
  eventDates: { start: request.startDate, end: request.endDate },
  location: request.location,
  items: quotation.items.map((item) => ({
    item: item.item,
    itemName: item.itemName,
    quantity: item.quantity
  })),
  finalAmount: quotation.finalTotal,
  status: 'Pending'
});

const loadMatchingBooking = async (requestId, quotationId) => {
  const [request, quotation, booking] = await Promise.all([
    EventRequest.findById(requestId),
    Quotation.findById(quotationId),
    Booking.findOne({ request: requestId })
  ]);
  if (
    !request
    || !quotation
    || quotation.status !== 'Accepted'
    || request.status !== 'Quotation Accepted'
    || !bookingMatchesRequestAndQuotation(booking, request, quotation)
  ) {
    return null;
  }
  return booking;
};

router.get('/admin/bookings', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultPageSize: 20, maxPageSize: 100 });
  if (!pagination) return res.status(400).json({ message: 'Booking list pagination is invalid.' });
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.scope === 'synthetic') {
    filter.isSynthetic = true;
  } else if (req.query.scope !== 'all' && req.query.scope !== 'combined') {
    filter.isSynthetic = { $ne: true };
  }
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean(),
    Booking.countDocuments(filter)
  ]);
  return sendPaginatedList(res, bookings, pagination, total);
}));

router.get(['/my', '/bookings/my'], authenticate, asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultPageSize: 20, maxPageSize: 100 });
  if (!pagination) return res.status(400).json({ message: 'Booking list pagination is invalid.' });
  const filter = { customer: req.user._id };
  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.pageSize),
    Booking.countDocuments(filter)
  ]);
  return sendPaginatedList(res, bookings, pagination, total);
}));

router.put('/admin/bookings/:id/status', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id) || !isPlainObject(req.body)) {
    return res.status(400).json({ message: 'Booking ID or update body is invalid.' });
  }
  const requestedStatus = req.body.status;
  if (!['Confirmed', 'Completed', 'Cancelled'].includes(requestedStatus)) {
    return res.status(400).json({ message: 'Invalid booking status.' });
  }
  if (requestedStatus === 'Confirmed') {
    return res.status(409).json({
      message: 'Booking confirmation is unavailable until inventory validation and reservation are implemented.'
    });
  }

  let session;
  try {
    session = await mongoose.startSession();
    let updatedBooking;
    await session.withTransaction(async () => {
      const booking = await Booking.findById(req.params.id).session(session);
      if (!booking) {
        const error = new Error('Booking not found.');
        error.statusCode = 404;
        throw error;
      }

      if (booking.status === requestedStatus) {
        updatedBooking = booking;
        return;
      }

      const allowedTransitions = {
        Pending: ['Cancelled'],
        Confirmed: ['Completed', 'Cancelled'],
        Completed: [],
        Cancelled: []
      };
      if (!allowedTransitions[booking.status] || !allowedTransitions[booking.status].includes(requestedStatus)) {
        const error = new Error('Invalid booking status transition.');
        error.statusCode = 409;
        throw error;
      }

      const request = await EventRequest.findById(booking.request).session(session);
      if (!request || request.user.toString() !== booking.customer.toString()) {
        const error = new Error('Related customer request not found or inconsistent.');
        error.statusCode = 409;
        throw error;
      }
      if (booking.quotation) {
        const quotation = await Quotation.findById(booking.quotation).session(session);
        if (
          !quotation
          || quotation.request.toString() !== request._id.toString()
          || quotation.customer.toString() !== request.user.toString()
        ) {
          const error = new Error('Related quotation not found or inconsistent.');
          error.statusCode = 409;
          throw error;
        }
      } else if (booking.status === 'Pending') {
        const error = new Error('A pending booking must have a related quotation.');
        error.statusCode = 409;
        throw error;
      }

      const requestStatus = requestedStatus === 'Completed' ? 'Completed' : 'Cancelled';
      const allowedRequestStatuses = requestedStatus === 'Completed'
        ? ['Confirmed', 'Completed']
        : ['Quotation Accepted', 'Confirmed', 'Cancelled'];
      if (!allowedRequestStatuses.includes(request.status)) {
        const error = new Error('Related request status is inconsistent with this booking transition.');
        error.statusCode = 409;
        throw error;
      }

      booking.status = requestedStatus;
      updatedBooking = await booking.save({ session });
      request.status = requestStatus;
      await request.save({ session });
    });
    return res.json(updatedBooking);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}));

router.post('/create', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      return res.status(400).json({ message: 'Booking details must be provided as an object.' });
    }
    const { request: requestId, quotation: quotationId } = req.body;
    if (!isObjectId(requestId) || !isObjectId(quotationId)) {
      return res.status(400).json({ message: 'Valid request and quotation IDs are required.' });
    }

    const request = await EventRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Customer request not found.' });
    }

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found.' });
    }
    if (
      quotation.request.toString() !== request._id.toString()
      || quotation.customer.toString() !== request.user.toString()
    ) {
      return res.status(409).json({ message: 'Quotation and customer request do not belong together.' });
    }
    if (quotation.status !== 'Accepted' || request.status !== 'Quotation Accepted') {
      return res.status(409).json({ message: 'Only an accepted quotation may create a pending booking.' });
    }

    const existingBooking = await Booking.findOne({ request: request._id });
    if (existingBooking) {
      if (!bookingMatchesRequestAndQuotation(existingBooking, request, quotation)) {
        return res.status(409).json({ message: 'A booking already exists for this request.' });
      }
      return res.json(existingBooking);
    }

    const booking = await Booking.create(
      createPendingBookingData(request, quotation, createBookingId())
    );
    return res.status(201).json(booking);
  } catch (error) {
    if (error.code === 11000) {
      const booking = await loadMatchingBooking(req.body.request, req.body.quotation);
      if (booking) {
        return res.json(booking);
      }
      if (error.keyPattern && error.keyPattern.request) {
        return res.status(409).json({ message: 'A booking already exists for this request.' });
      }
    }
    throw error;
  }
}));

router.createPendingBookingData = createPendingBookingData;

module.exports = router;
