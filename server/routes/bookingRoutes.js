const express = require('express');
const Booking = require('../models/Booking');
const EventRequest = require('../models/EventRequest');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const createBookingId = () => `PJTHB-${Math.floor(1000 + Math.random() * 9000)}`;

router.get('/admin/bookings', authenticate, requireAdmin, async (req, res) => {
  const bookings = await Booking.find({}).populate('customer', 'name email').sort({ createdAt: -1 });
  res.json(bookings);
});

router.get('/my', authenticate, async (req, res) => {
  const bookings = await Booking.find({ customer: req.user._id }).sort({ createdAt: -1 });
  res.json(bookings);
});

router.put('/admin/bookings/:id/status', authenticate, requireAdmin, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });

  booking.status = req.body.status || booking.status;
  await booking.save();

  if (booking.status === 'Confirmed') {
    await EventRequest.findByIdAndUpdate(booking.request, { status: 'Confirmed' });
  }

  res.json(booking);
});

router.post('/create', authenticate, requireAdmin, async (req, res) => {
  const { customer, request, quotation, eventDates, location, items, finalAmount } = req.body;

  const booking = await Booking.create({
    bookingId: createBookingId(),
    customer,
    request,
    quotation,
    eventDates,
    location,
    items,
    finalAmount,
    status: 'Confirmed'
  });

  await EventRequest.findByIdAndUpdate(request, { status: 'Confirmed' });
  res.status(201).json(booking);
});

module.exports = router;
