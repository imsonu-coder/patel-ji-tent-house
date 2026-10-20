const express = require('express');
const EventRequest = require('../models/EventRequest');
const Booking = require('../models/Booking');
const Item = require('../models/Item');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const SupplierArrangement = require('../models/SupplierArrangement');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const totalRequests = await EventRequest.countDocuments();
    const totalBookings = await Booking.countDocuments({ status: 'Confirmed' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const confirmedBookings = await Booking.find({ status: 'Confirmed' });
    const revenue = confirmedBookings.reduce((sum, booking) => sum + (booking.finalAmount || 0), 0);
    const pendingRequests = await EventRequest.countDocuments({ status: 'Submitted' });
    const conversionRate = totalRequests ? (totalBookings / totalRequests) * 100 : 0;
    const avgBooking = totalBookings ? revenue / totalBookings : 0;

    res.json({
      totalRequests,
      totalBookings,
      totalCustomers,
      revenue,
      pendingRequests,
      conversionRate,
      averageBookingValue: avgBooking
    });
  } catch (error) {
    res.status(500).json({ message: 'Analytics unavailable.', error: error.message });
  }
});

router.get('/bookings', authenticate, requireAdmin, async (req, res) => {
  const bookings = await Booking.find({}).sort({ createdAt: -1 });
  res.json(bookings);
});

router.get('/revenue', authenticate, requireAdmin, async (req, res) => {
  const confirmed = await Booking.find({ status: 'Confirmed' });
  const totalRevenue = confirmed.reduce((sum, booking) => sum + (booking.finalAmount || 0), 0);
  res.json({ totalRevenue, data: confirmed });
});

router.get('/items', authenticate, requireAdmin, async (req, res) => {
  const items = await Item.find({ status: 'active' }).populate('category');
  res.json(items);
});

router.get('/events', authenticate, requireAdmin, async (req, res) => {
  const events = await EventRequest.aggregate([
    { $group: { _id: '$eventType', count: { $sum: 1 } } }
  ]);
  res.json(events);
});

router.get('/suppliers', authenticate, requireAdmin, async (req, res) => {
  const supplierStats = await SupplierArrangement.aggregate([
    { $group: { _id: '$itemName', count: { $sum: 1 } } }
  ]);
  const suppliers = await Supplier.find({});
  res.json({ suppliers, supplierStats });
});

module.exports = router;
