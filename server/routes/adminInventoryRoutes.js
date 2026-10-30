const express = require('express');
const Item = require('../models/Item');
const InventoryReservation = require('../models/InventoryReservation');
const InventoryReturnInspection = require('../models/InventoryReturnInspection');
const Booking = require('../models/Booking');
const SupplierArrangement = require('../models/SupplierArrangement');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { normalizeDateRange } = require('../services/inventoryService');
const { buildInventoryDashboard } = require('../services/inventoryDashboardService');
const {
  isObjectId,
  parsePagination,
  sendPaginatedList
} = require('../utils/httpValidation');

const router = express.Router();

const isDateOnly = (value) => (
  typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(value)
);

const getSyntheticFilter = (scope) => {
  if (scope === 'synthetic') return { isSynthetic: true };
  if (scope === 'all' || scope === 'combined') return {};
  return { isSynthetic: { $ne: true } };
};

router.get('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  if (!isDateOnly(req.query.start) || !isDateOnly(req.query.end)) {
    return res.status(400).json({ message: 'Valid start and end dates are required.' });
  }

  let range;
  try {
    range = normalizeDateRange(req.query.start, req.query.end);
  } catch (error) {
    if (error instanceof RangeError || error instanceof TypeError) {
      return res.status(400).json({ message: 'Inventory date range is invalid.' });
    }
    throw error;
  }

  const filter = getSyntheticFilter(req.query.scope);

  const [
    items,
    reservations,
    inspections,
    bookings,
    supplierArrangements,
    administrators
  ] = await Promise.all([
    Item.find(filter).select('name category ownStock status isSynthetic').populate('category', 'name').sort({ name: 1 }).lean(),
    InventoryReservation.find(filter).select(
      'booking item quantity eventDates source supplierArrangement status provenance verificationStatus verifiedAt verifiedBy isSynthetic'
    ).lean(),
    InventoryReturnInspection.find({ releaseStatus: 'Released', ...filter }).select(
      'booking reservation item returnedQuantity inspectionOutcome releaseStatus releasedQuantity releasedAt releasedBy isSynthetic'
    ).lean(),
    Booking.find(filter).select('_id status inventoryVerificationStatus items eventDates isSynthetic').lean(),
    SupplierArrangement.find(filter).select(
      'supplier item itemName quantity confirmedQuantity eventDates supplierCommitmentReference supplierCommitmentLineIdentity commitmentVerificationStatus commitmentVerifiedAt commitmentVerifiedBy commitmentVerificationEvidenceReference supplyStatus supplyConfirmedAt supplyConfirmedBy allocationStatus cancellationReviewStatus cancellationResolvedAt cancellationResolvedBy cancellationResolutionReason status isSynthetic'
    )
      .populate('supplier', 'name')
      .populate('item', 'name')
      .populate('commitmentVerifiedBy', 'name')
      .populate('supplyConfirmedBy', 'name')
      .populate('cancellationResolvedBy', 'name')
      .sort({ updatedAt: -1 })
      .lean(),
    User.find({ role: 'admin', status: 'active', ...filter }).select('_id').lean()
  ]);

  const snapshot = buildInventoryDashboard({
    items,
    reservations,
    inspections,
    bookings,
    supplierArrangements,
    authorizedAdminIds: administrators.map((admin) => admin._id),
    range
  });
  return res.json(snapshot);
}));

router.get('/inspections', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultPageSize: 10, maxPageSize: 50 });
  if (!pagination) {
    return res.status(400).json({ message: 'Pagination parameters are invalid.' });
  }

  const filter = getSyntheticFilter(req.query.scope);

  const [total, inspections] = await Promise.all([
    InventoryReturnInspection.countDocuments(filter),
    InventoryReturnInspection.find(filter)
      .populate('item', 'name')
      .populate('booking', 'bookingId')
      .populate('inspectedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
  ]);

  return sendPaginatedList(res, inspections, pagination, total);
}));

router.post('/inspections', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { bookingId, itemId, returnedQuantity, inspectionOutcome, notes } = req.body;
  if (!isObjectId(bookingId) || !isObjectId(itemId)) {
    return res.status(400).json({ message: 'Valid booking and item IDs are required.' });
  }
  const qty = parseInt(returnedQuantity, 10);
  if (!Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({ message: 'Returned quantity must be at least 1.' });
  }
  if (!['Passed', 'Failed', 'Damaged', 'NeedsRepair'].includes(inspectionOutcome)) {
    return res.status(400).json({ message: 'Invalid inspection outcome.' });
  }

  const [booking, item] = await Promise.all([
    Booking.findById(bookingId),
    Item.findById(itemId)
  ]);
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });
  if (!item) return res.status(404).json({ message: 'Item not found.' });

  let reservation = await InventoryReservation.findOne({ booking: booking._id, item: item._id });
  if (!reservation) {
    reservation = await InventoryReservation.create({
      booking: booking._id,
      item: item._id,
      quantity: qty,
      eventDates: booking.eventDates || { start: new Date(), end: new Date() },
      source: 'Owned'
    });
  }

  const isPassed = inspectionOutcome === 'Passed';
  const inspection = await InventoryReturnInspection.create({
    booking: booking._id,
    reservation: reservation._id,
    item: item._id,
    returnedQuantity: qty,
    inspectionOutcome,
    inspectedBy: req.user._id,
    inspectedAt: new Date(),
    notes: typeof notes === 'string' ? notes.trim() : '',
    releaseStatus: isPassed ? 'Released' : 'NotReleased',
    releasedQuantity: isPassed ? qty : 0,
    releasedAt: isPassed ? new Date() : undefined,
    releasedBy: isPassed ? req.user._id : undefined,
    isSynthetic: false
  });

  const populated = await InventoryReturnInspection.findById(inspection._id)
    .populate('item', 'name')
    .populate('booking', 'bookingId')
    .populate('inspectedBy', 'name');

  return res.status(201).json(populated);
}));

module.exports = router;
