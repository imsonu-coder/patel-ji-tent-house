const express = require('express');
const EventRequest = require('../models/EventRequest');
const Item = require('../models/Item');
const { authenticate, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { requestCreationLimiter } = require('../middleware/rateLimiter');
const {
  isObjectId,
  isPlainObject,
  parseListLimit,
  readText,
  sendBoundedList,
  parsePagination,
  sendPaginatedList
} = require('../utils/httpValidation');

const router = express.Router();
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const createRequestId = () => `PJTH-${Math.floor(1000 + Math.random() * 9000)}`;

const parseRequestDate = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return null;
    }
    return parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getInclusiveRentalDays = (startDate, endDate) => {
  const startUtc = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const endUtc = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
  const diffDays = Math.round((endUtc.getTime() - startUtc.getTime()) / DAY_IN_MS);

  if (diffDays < 0) {
    return null;
  }

  return diffDays + 1;
};

const createClientError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateRequestDetails = (eventType, location) => {
  const allowedEventTypes = EventRequest.schema.path('eventType').enumValues;
  if (!allowedEventTypes.includes(eventType)) {
    throw createClientError('Choose a valid event type.');
  }
  if (!readText(location, { max: 300 })) {
    throw createClientError('Enter the event location.');
  }
};

const calculateItemEstimate = (itemDoc, quantity, rentalDays) => {
  const normalizedQuantity = Number(quantity);
  const unitPrice = Number(itemDoc.basePrice || 0);

  if (itemDoc.priceUnit === 'Per Day') {
    return unitPrice * normalizedQuantity * rentalDays;
  }

  return unitPrice * normalizedQuantity;
};

router.post('/requests', authenticate, requestCreationLimiter, asyncHandler(async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw createClientError('Event details must be provided as an object.');
    }
    const {
      eventType,
      startDate,
      endDate,
      location,
      guestCount,
      additionalRequirements,
      description,
      items
    } = req.body;

    if (
      typeof eventType !== 'string'
      || typeof startDate !== 'string'
      || startDate.length > 40
      || typeof endDate !== 'string'
      || endDate.length > 40
      || !location
      || guestCount === undefined
      || guestCount === null
      || guestCount === ''
    ) {
      return res.status(400).json({ message: 'Event details are incomplete.' });
    }
    validateRequestDetails(eventType, location);

    const parsedStartDate = parseRequestDate(startDate);
    const parsedEndDate = parseRequestDate(endDate);

    if (!parsedStartDate || !parsedEndDate) {
      return res.status(400).json({ message: 'Event dates must be valid dates.' });
    }

    if (parsedEndDate.getTime() < parsedStartDate.getTime()) {
      return res.status(400).json({ message: 'End date must be on or after the start date.' });
    }

    const normalizedGuestCount = Number(guestCount);
    if (!Number.isSafeInteger(normalizedGuestCount) || normalizedGuestCount < 1 || normalizedGuestCount > 1000000) {
      return res.status(400).json({ message: 'Guest count must be a positive integer.' });
    }

    const rentalDays = getInclusiveRentalDays(parsedStartDate, parsedEndDate);
    if (!rentalDays) {
      return res.status(400).json({ message: 'Rental duration could not be calculated.' });
    }

    if (items !== undefined && !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items must be provided as an array.' });
    }
    if (Array.isArray(items) && items.length > 100) {
      return res.status(400).json({ message: 'A request may contain at most 100 item lines.' });
    }
    const normalizedRequirements = additionalRequirements === undefined
      ? ''
      : readText(additionalRequirements, { min: 0, max: 2000 });
    const normalizedDescription = description === undefined
      ? ''
      : readText(description, { min: 0, max: 2000 });
    if (normalizedRequirements === null || normalizedDescription === null) {
      return res.status(400).json({ message: 'Additional event details exceed the allowed length.' });
    }

    const selectedItems = Array.isArray(items) ? items : [];
    const normalizedItems = await Promise.all(
      selectedItems.map(async (entry, index) => {
        if (!isPlainObject(entry)) {
          throw createClientError(`Item at index ${index} is invalid.`, 400);
        }

        const itemId = entry.itemId || entry.item;
        if (!isObjectId(String(itemId || ''))) {
          throw createClientError('Each item must include a valid item ID.', 400);
        }

        const itemDoc = await Item.findById(itemId);
        if (!itemDoc) {
          throw createClientError('One or more selected items could not be found.', 404);
        }

        if (itemDoc.status !== 'active') {
          throw createClientError(`Item "${itemDoc.name}" is currently unavailable.`, 400);
        }

        const quantity = Number(entry.quantity);
        if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000000) {
          throw createClientError(`Quantity for "${itemDoc.name}" must be a positive integer.`, 400);
        }

        const estimatedPrice = calculateItemEstimate(itemDoc, quantity, rentalDays);

        return {
          item: itemDoc._id,
          itemName: itemDoc.name,
          quantity,
          unitPrice: Number(itemDoc.basePrice || 0),
          estimatedPrice
        };
      })
    );

    const estimatedAmount = normalizedItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);

    const request = await EventRequest.create({
      user: req.user._id,
      requestId: createRequestId(),
      eventType,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      location: location.trim(),
      guestCount: normalizedGuestCount,
      additionalRequirements: normalizedRequirements,
      description: normalizedDescription,
      items: normalizedItems,
      estimatedAmount
    });

    res.status(201).json(request);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    throw error;
  }
}));

router.get('/requests/my', authenticate, asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultPageSize: 20, maxPageSize: 100 });
  if (!pagination) return res.status(400).json({ message: 'Request list pagination is invalid.' });
  const filter = { user: req.user._id };
  const [requests, total] = await Promise.all([
    EventRequest.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.pageSize)
      .lean(),
    EventRequest.countDocuments(filter)
  ]);
  return sendPaginatedList(res, requests, pagination, total);
}));

router.get('/requests/:id', authenticate, asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Request ID is invalid.' });
  const request = await EventRequest.findById(req.params.id).populate('user', 'name email phone');
  if (!request) return res.status(404).json({ message: 'Request not found.' });

  if (req.user.role !== 'admin' && request.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You do not have access to this request.' });
  }

  res.json(request);
}));

router.get('/admin/requests', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultPageSize: 20, maxPageSize: 100 });
  if (!pagination) return res.status(400).json({ message: 'Request list pagination is invalid.' });
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.scope === 'synthetic') {
    filter.isSynthetic = true;
  } else if (req.query.scope !== 'all' && req.query.scope !== 'combined') {
    filter.isSynthetic = { $ne: true };
  }
  const [requests, total] = await Promise.all([
    EventRequest.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.pageSize),
    EventRequest.countDocuments(filter)
  ]);
  return sendPaginatedList(res, requests, pagination, total);
}));

router.put('/admin/requests/:id/status', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id) || !isPlainObject(req.body)) {
    return res.status(400).json({ message: 'Request ID or update body is invalid.' });
  }
  const { status, note } = req.body;
  if (note !== undefined && !readText(note, { min: 0, max: 1000 })) {
    return res.status(400).json({ message: 'Request note is invalid.' });
  }
  const request = await EventRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found.' });

  const allowedTransitions = {
    Submitted: ['Under Review', 'Rejected', 'Cancelled'],
    'Under Review': ['Rejected', 'Cancelled']
  };
  if (!allowedTransitions[request.status] || !allowedTransitions[request.status].includes(status)) {
    return res.status(409).json({ message: 'Invalid request status transition.' });
  }

  const update = { $set: { status } };
  if (note) update.$push = { notes: note.trim() };
  const updatedRequest = await EventRequest.findOneAndUpdate(
    { _id: request._id, status: request.status },
    update,
    { new: true, runValidators: true }
  );
  if (!updatedRequest) {
    return res.status(409).json({ message: 'Request status changed; reload and try again.' });
  }

  res.json(updatedRequest);
}));

router.calculateInclusiveRentalDays = getInclusiveRentalDays;
router.calculateItemEstimate = calculateItemEstimate;
router.parseRequestDate = parseRequestDate;
router.validateRequestDetails = validateRequestDetails;

module.exports = router;
