const fs = require('fs');
const path = require('path');
const express = require('express');
const EventRequest = require('../models/EventRequest');
const Booking = require('../models/Booking');
const Item = require('../models/Item');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const SupplierArrangement = require('../models/SupplierArrangement');
const InventoryReservation = require('../models/InventoryReservation');
const InventoryReturnInspection = require('../models/InventoryReturnInspection');
const { authenticate, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { normalizeDateRange } = require('../services/inventoryService');
const { buildAnalytics } = require('../services/analyticsService');
const {
  parseListLimit,
  sendBoundedList
} = require('../utils/httpValidation');

const router = express.Router();

/**
 * Derives MongoDB query filter based on analytics scope.
 * - 'real' (default): only genuine production records
 * - 'synthetic': only synthetic test records
 * - 'all' / 'combined': all records
 */
const getSyntheticFilter = (scope) => {
  if (scope === 'synthetic') {
    return { isSynthetic: true };
  }
  if (scope === 'all' || scope === 'combined') {
    return {};
  }
  return { isSynthetic: { $ne: true } };
};

router.get('/overview', authenticate, requireAdmin, asyncHandler(async (req, res) => {
    const scope = req.query.scope || 'real';
    const filter = getSyntheticFilter(scope);
    const [
      totalRequests,
      totalBookings,
      totalCustomers,
      revenueResult,
      pendingRequests
    ] = await Promise.all([
      EventRequest.countDocuments(filter),
      Booking.countDocuments({ status: 'Confirmed', ...filter }),
      User.countDocuments({ role: 'customer', ...filter }),
      Booking.aggregate([
        { $match: { status: 'Confirmed', ...filter } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$finalAmount', 0] } } } }
      ]),
      EventRequest.countDocuments({ status: 'Submitted', ...filter })
    ]);
    const revenue = revenueResult[0]?.total || 0;
    const conversionRate = totalRequests ? (totalBookings / totalRequests) * 100 : 0;
    const avgBooking = totalBookings ? revenue / totalBookings : 0;

    return res.json({
      scope,
      totalRequests,
      totalBookings,
      totalCustomers,
      revenue,
      pendingRequests,
      conversionRate,
      averageBookingValue: avgBooking
    });
}));

router.get('/bookings', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const limit = parseListLimit(req.query.limit);
  if (!limit) return res.status(400).json({ message: 'Analytics list limit is invalid.' });
  const filter = getSyntheticFilter(req.query.scope);
  const bookings = await Booking.find(filter).sort({ createdAt: -1 }).limit(limit + 1).lean();
  return sendBoundedList(res, bookings, limit);
}));

router.get('/revenue', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const limit = parseListLimit(req.query.limit);
  if (!limit) return res.status(400).json({ message: 'Analytics list limit is invalid.' });
  const scope = req.query.scope || 'real';
  const filter = getSyntheticFilter(scope);
  const [revenueResult, totalRecords, confirmed] = await Promise.all([
    Booking.aggregate([
      { $match: { status: 'Confirmed', ...filter } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$finalAmount', 0] } } } }
    ]),
    Booking.countDocuments({ status: 'Confirmed', ...filter }),
    Booking.find({ status: 'Confirmed', ...filter })
      .select('bookingId finalAmount status createdAt isSynthetic')
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean()
  ]);
  const truncated = confirmed.length > limit;
  res.set('X-Result-Limit', String(limit));
  res.set('X-Results-Truncated', String(truncated));
  return res.json({
    scope,
    totalRevenue: revenueResult[0]?.total || 0,
    totalRecords,
    data: truncated ? confirmed.slice(0, limit) : confirmed
  });
}));

router.get('/items', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const limit = parseListLimit(req.query.limit);
  if (!limit) return res.status(400).json({ message: 'Analytics list limit is invalid.' });
  const filter = getSyntheticFilter(req.query.scope);
  const items = await Item.find({ status: 'active', ...filter })
    .populate('category')
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();
  return sendBoundedList(res, items, limit);
}));

router.get('/events', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const filter = getSyntheticFilter(req.query.scope);
  const events = await EventRequest.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $ifNull: ['$eventType', 'Other'] },
        count: { $sum: 1 },
        estimatedTotal: { $sum: { $ifNull: ['$estimatedTotal', 0] } }
      }
    },
    { $sort: { count: -1 } }
  ]);
  return res.json(events);
}));

router.get('/qc', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const filter = getSyntheticFilter(req.query.scope);
  const stats = await InventoryReturnInspection.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $ifNull: ['$inspectionOutcome', 'Uninspected'] },
        count: { $sum: 1 },
        totalReturned: { $sum: { $ifNull: ['$returnedQuantity', 0] } },
        totalReleased: { $sum: { $ifNull: ['$releasedQuantity', 0] } }
      }
    },
    { $sort: { count: -1 } }
  ]);
  return res.json(stats);
}));

router.get('/funnel', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const filter = getSyntheticFilter(req.query.scope);
  const [submitted, quoting, quotesSent, confirmed, completed, cancelled] = await Promise.all([
    EventRequest.countDocuments(filter),
    EventRequest.countDocuments({ status: 'Quoting', ...filter }),
    EventRequest.countDocuments({ status: { $in: ['Quotation Sent', 'Confirmed', 'Completed'] }, ...filter }),
    Booking.countDocuments({ status: { $in: ['Confirmed', 'Completed'] }, ...filter }),
    Booking.countDocuments({ status: 'Completed', ...filter }),
    Booking.countDocuments({ status: 'Cancelled', ...filter })
  ]);

  const stages = [
    { id: 'inquiries', label: 'Inquiries Received', count: submitted, dropoffPercent: 0 },
    { id: 'quoting', label: 'Commercial Estimation', count: quoting + quotesSent, dropoffPercent: submitted ? Math.max(0, Math.round(((submitted - (quoting + quotesSent)) / submitted) * 100)) : 0 },
    { id: 'quotes_sent', label: 'Quotations Sent', count: quotesSent, dropoffPercent: (quoting + quotesSent) ? Math.max(0, Math.round((quoting / (quoting + quotesSent)) * 100)) : 0 },
    { id: 'confirmed', label: 'Bookings Confirmed', count: confirmed, dropoffPercent: quotesSent ? Math.max(0, Math.round(((quotesSent - confirmed) / quotesSent) * 100)) : 0 },
    { id: 'completed', label: 'Events Completed', count: completed, dropoffPercent: confirmed ? Math.max(0, Math.round(((confirmed - completed) / confirmed) * 100)) : 0 }
  ];

  return res.json({
    stages,
    cancelledCount: cancelled,
    overallConversionRate: submitted ? Number(((confirmed / submitted) * 100).toFixed(1)) : 0
  });
}));

router.get('/export', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const dataset = req.query.dataset || 'bookings';
  const fileMap = {
    bookings: 'bookings.csv',
    requests: 'event_requests.csv',
    customers: 'customers.csv',
    inventory: 'inventory_items.csv',
    reservations: 'inventory_reservations.csv',
    inspections: 'inventory_return_inspections.csv',
    payments: 'payments_synthetic.csv',
    suppliers: 'suppliers.csv'
  };

  const filename = fileMap[dataset];
  if (!filename) {
    return res.status(400).json({ message: 'Invalid dataset requested.' });
  }

  const filePath = path.join(__dirname, '..', 'synthetic', 'exports', filename);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    return fs.createReadStream(filePath).pipe(res);
  }

  return res.status(404).json({ message: 'Requested export file not found.' });
}));

router.get('/suppliers', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const limit = parseListLimit(req.query.limit);
  if (!limit) return res.status(400).json({ message: 'Supplier list limit is invalid.' });
  const filter = getSyntheticFilter(req.query.scope);
  const [supplierStats, suppliers] = await Promise.all([
    SupplierArrangement.aggregate([
      { $match: filter },
      { $group: { _id: '$itemName', count: { $sum: 1 } } }
    ]),
    Supplier.find(filter).sort({ createdAt: -1 }).limit(limit + 1).lean()
  ]);
  const truncated = suppliers.length > limit;
  res.set('X-Result-Limit', String(limit));
  res.set('X-Results-Truncated', String(truncated));
  return res.json({ suppliers: truncated ? suppliers.slice(0, limit) : suppliers, supplierStats });
}));

router.get('/insights', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { start, end, scope } = req.query;
  if (
    typeof start !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(start)
    || typeof end !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(end)
  ) {
    return res.status(400).json({ message: 'Valid start and end dates are required.' });
  }

  let availabilityRange;
  try {
    availabilityRange = normalizeDateRange(start, end);
  } catch (error) {
    if (error instanceof RangeError || error instanceof TypeError) {
      return res.status(400).json({ message: 'Analytics date range is invalid.' });
    }
    throw error;
  }

  const historyStart = new Date(Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth() - 11,
    1
  ));
  const filter = getSyntheticFilter(scope);
  const [
    requests,
    bookings,
    items,
    inventoryReservations,
    inspections,
    supplierArrangements,
    administrators
  ] = await Promise.all([
    EventRequest.find({
      ...filter,
      $or: [
        { createdAt: { $gte: historyStart } },
        {
          startDate: { $lte: availabilityRange.end },
          endDate: { $gte: availabilityRange.start }
        }
      ]
    }).select('createdAt status startDate endDate items isSynthetic').lean(),
    Booking.find({
      ...filter,
      createdAt: { $gte: historyStart }
    }).select(
      'createdAt status finalAmount request items eventDates inventoryVerificationStatus isSynthetic'
    ).lean(),
    Item.find(filter).select('name category ownStock status isSynthetic').populate('category', 'name').lean(),
    InventoryReservation.find(filter).select(
      'booking item quantity eventDates source supplierArrangement status provenance verificationStatus verificationEvidenceReference verifiedAt verifiedBy isSynthetic'
    ).lean(),
    InventoryReturnInspection.find({ releaseStatus: 'Released', ...filter }).select(
      'booking reservation item returnedQuantity inspectionOutcome releaseStatus releasedQuantity releasedAt releasedBy isSynthetic'
    ).lean(),
    SupplierArrangement.find(filter).select(
      'supplier item itemName quantity confirmedQuantity eventDates supplierCommitmentReference supplierCommitmentLineIdentity commitmentVerificationStatus commitmentVerifiedAt commitmentVerifiedBy commitmentVerificationEvidenceReference supplyStatus supplyConfirmedAt supplyConfirmedBy allocationStatus cancellationReviewStatus cancellationResolvedAt cancellationResolvedBy cancellationResolutionReason status isSynthetic'
    ).lean(),
    User.find({ role: 'admin', status: 'active', ...filter }).select('_id').lean()
  ]);

  return res.json(buildAnalytics({
    requests,
    bookings,
    items,
    inventoryReservations,
    inspections,
    supplierArrangements,
    administrators,
    availabilityRange,
    scope: scope || 'real'
  }));
}));

module.exports = router;
