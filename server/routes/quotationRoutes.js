const express = require('express');
const mongoose = require('mongoose');
const Quotation = require('../models/Quotation');
const EventRequest = require('../models/EventRequest');
const { authenticate, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const {
  isObjectId,
  isPlainObject,
  parseListLimit,
  readNonNegativeNumber,
  readText,
  sendBoundedList,
  parsePagination,
  sendPaginatedList
} = require('../utils/httpValidation');

const router = express.Router();
const editableQuotationFields = new Set([
  'items',
  'decorationServices',
  'transportation',
  'discount',
  'additionalCharges',
  'notes',
  'validityDate',
  'status'
]);
const adjustmentFields = [
  'decorationServices',
  'transportation',
  'discount',
  'additionalCharges'
];

const createClientError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''))
  && /^[a-f\d]{24}$/i.test(String(value));

const readAmount = (value, label) => {
  const amount = readNonNegativeNumber(value);
  if (amount === null) {
    throw createClientError(`${label} must be a finite, non-negative amount.`);
  }

  return amount;
};

const validateEditableFields = (body, allowedFields) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createClientError('Quotation details must be an object.');
  }

  const unexpectedField = Object.keys(body).find((field) => !allowedFields.has(field));
  if (unexpectedField) {
    throw createClientError(`Quotation field "${unexpectedField}" cannot be edited.`);
  }
};

const normalizeItems = (requestItems, submittedItems) => {
  if (submittedItems !== undefined && !Array.isArray(submittedItems)) {
    throw createClientError('Quotation items must be an array.');
  }

  if (submittedItems && (
    submittedItems.length !== requestItems.length
    || submittedItems.length > 100
  )) {
    throw createClientError('Quotation items must match the customer request.');
  }

  return requestItems.map((requestItem, index) => {
    const submittedItem = submittedItems ? submittedItems[index] : {};
    if (!isPlainObject(submittedItem)) {
      throw createClientError(`Quotation item at index ${index} is invalid.`);
    }

    const allowedLineFields = new Set(['itemName', 'quantity', 'unitPrice', 'subtotal']);
    const unexpectedField = Object.keys(submittedItem).find((field) => !allowedLineFields.has(field));
    if (unexpectedField) {
      throw createClientError(`Quotation item field "${unexpectedField}" cannot be edited.`);
    }

    if (submittedItem.itemName !== undefined && submittedItem.itemName !== requestItem.itemName) {
      throw createClientError('Quotation item names must match the customer request.');
    }
    if (
      submittedItem.quantity !== undefined
      && Number(submittedItem.quantity) !== requestItem.quantity
    ) {
      throw createClientError('Quotation item quantities must match the customer request.');
    }
    if (submittedItem.subtotal !== undefined) {
      readAmount(submittedItem.subtotal, `Subtotal for ${requestItem.itemName}`);
    }

    if (!Number.isSafeInteger(requestItem.quantity) || requestItem.quantity < 1) {
      throw createClientError(`Requested quantity for ${requestItem.itemName} is invalid.`);
    }
    const defaultUnitPrice = Number(requestItem.estimatedPrice) / requestItem.quantity;
    if (!Number.isFinite(defaultUnitPrice) || defaultUnitPrice < 0) {
      throw createClientError(`Requested estimate for ${requestItem.itemName} is invalid.`);
    }
    const unitPrice = submittedItem.unitPrice === undefined
      ? readAmount(defaultUnitPrice, `Unit price for ${requestItem.itemName}`)
      : readAmount(submittedItem.unitPrice, `Unit price for ${requestItem.itemName}`);

    return {
      item: requestItem.item,
      itemName: requestItem.itemName,
      quantity: requestItem.quantity,
      unitPrice,
      subtotal: unitPrice * requestItem.quantity
    };
  });
};

const calculateQuotationTotal = (items, adjustments) => {
  const itemTotal = items.reduce((total, item) => total + item.subtotal, 0);
  const total = itemTotal
    + adjustments.decorationServices
    + adjustments.transportation
    + adjustments.additionalCharges
    - adjustments.discount;

  if (!Number.isFinite(total) || total < 0) {
    throw createClientError('Quotation total must be finite and non-negative.');
  }

  return total;
};

const normalizeAdjustments = (source, existing = {}) => {
  const adjustments = {};
  adjustmentFields.forEach((field) => {
    adjustments[field] = source[field] === undefined
      ? readAmount(existing[field] === undefined ? 0 : existing[field], field)
      : readAmount(source[field], field);
  });
  return adjustments;
};

const normalizeValidityDate = (value) => {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string' || value.length > 40) {
    throw createClientError('Quotation validity date must be valid.');
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    if (
      date.getUTCFullYear() !== year
      || date.getUTCMonth() !== month - 1
      || date.getUTCDate() !== day
    ) {
      throw createClientError('Quotation validity date must be valid.');
    }
    return date;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createClientError('Quotation validity date must be valid.');
  }
  return date;
};

const isValidityDateExpired = (validityDate, now = Date.now()) => {
  const time = validityDate.getTime();
  const isUtcMidnight = validityDate.getUTCHours() === 0
    && validityDate.getUTCMinutes() === 0
    && validityDate.getUTCSeconds() === 0
    && validityDate.getUTCMilliseconds() === 0;
  const deadline = isUtcMidnight
    ? Date.UTC(
      validityDate.getUTCFullYear(),
      validityDate.getUTCMonth(),
      validityDate.getUTCDate(),
      23,
      59,
      59,
      999
    )
    : time;

  return deadline < now;
};

const isQuotationRequestStatus = (status) => ['Submitted', 'Under Review'].includes(status);
const isMatchingQuotationResponse = (quotationStatus, requestStatus, requestedStatus) => (
  quotationStatus === requestedStatus
  && requestStatus === (requestedStatus === 'Accepted' ? 'Quotation Accepted' : 'Rejected')
);

router.post('/admin/quotations', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  let session;
  try {
    const allowedFields = new Set([
      'request',
      'items',
      ...adjustmentFields,
      'notes',
      'validityDate',
      'status'
    ]);
    validateEditableFields(req.body, allowedFields);

    if (!isValidObjectId(req.body.request)) {
      throw createClientError('A valid customer request is required.');
    }

    const request = await EventRequest.findById(req.body.request);
    if (!request) {
      throw createClientError('Customer request not found.', 404);
    }
    if (!isQuotationRequestStatus(request.status)) {
      throw createClientError('A quotation cannot be created for this request status.', 409);
    }

    const status = req.body.status === undefined ? 'Draft' : req.body.status;
    if (!['Draft', 'Sent'].includes(status)) {
      throw createClientError('A new quotation may only be Draft or Sent.');
    }

    const items = normalizeItems(request.items, req.body.items);
    const adjustments = normalizeAdjustments(req.body);
    const finalTotal = calculateQuotationTotal(items, adjustments);
    const quotationData = {
      request: request._id,
      customer: request.user,
      eventType: request.eventType,
      eventDates: { start: request.startDate, end: request.endDate },
      items,
      ...adjustments,
      finalTotal,
      notes: req.body.notes === undefined ? '' : readText(req.body.notes, { min: 0, max: 2000 }),
      validityDate: req.body.validityDate === undefined
        ? undefined
        : normalizeValidityDate(req.body.validityDate),
      status
    };
    if (quotationData.notes === null) {
      throw createClientError('Quotation notes exceed the allowed length.');
    }

    session = await mongoose.startSession();
    let quotation;
    await session.withTransaction(async () => {
      const activeQuotation = await Quotation.findOne({
        request: request._id,
        status: { $in: ['Draft', 'Sent', 'Accepted'] }
      }).session(session);
      if (activeQuotation) {
        throw createClientError('An active quotation already exists for this request.', 409);
      }

      const requestStatus = status === 'Sent' ? 'Quotation Sent' : 'Quotation Draft';
      const requestUpdate = await EventRequest.updateOne(
        { _id: request._id, status: { $in: ['Submitted', 'Under Review'] } },
        { $set: { status: requestStatus } },
        { session }
      );
      if (requestUpdate.matchedCount !== 1) {
        throw createClientError('Customer request status changed; reload and try again.', 409);
      }
      [quotation] = await Quotation.create([quotationData], { session });
    });
    return res.status(201).json(quotation);
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

router.get('/quotations/my', authenticate, asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultPageSize: 20, maxPageSize: 100 });
  if (!pagination) return res.status(400).json({ message: 'Quotation list pagination is invalid.' });
  const filter = { customer: req.user._id };
  const [quotations, total] = await Promise.all([
    Quotation.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.pageSize)
      .lean(),
    Quotation.countDocuments(filter)
  ]);
  return sendPaginatedList(res, quotations, pagination, total);
}));

router.get('/admin/quotations', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultPageSize: 20, maxPageSize: 100 });
  if (!pagination) return res.status(400).json({ message: 'Quotation list pagination is invalid.' });
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.scope === 'synthetic') {
    filter.isSynthetic = true;
  } else if (req.query.scope !== 'all' && req.query.scope !== 'combined') {
    filter.isSynthetic = { $ne: true };
  }
  const [quotations, total] = await Promise.all([
    Quotation.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.pageSize),
    Quotation.countDocuments(filter)
  ]);
  return sendPaginatedList(res, quotations, pagination, total);
}));

router.put('/admin/quotations/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  let session;
  try {
    if (!isObjectId(req.params.id)) throw createClientError('Quotation ID is invalid.');
    validateEditableFields(req.body, editableQuotationFields);
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found.' });
    }
    if (quotation.status === 'Sent') {
      if (Object.keys(req.body).length === 1 && req.body.status === 'Expired') {
        session = await mongoose.startSession();
        let expiredQuotation;
        await session.withTransaction(async () => {
          const requestUpdate = await EventRequest.updateOne(
            { _id: quotation.request, status: 'Quotation Sent' },
            { $set: { status: 'Quotation Expired' } },
            { session }
          );
          if (requestUpdate.matchedCount !== 1) {
            throw createClientError('Related request status changed; reload and try again.', 409);
          }
          expiredQuotation = await Quotation.findOneAndUpdate(
            { _id: quotation._id, status: 'Sent' },
            { $set: { status: 'Expired' } },
            { new: true, runValidators: true, session }
          );
          if (!expiredQuotation) {
            throw createClientError('Quotation status changed; reload and try again.', 409);
          }
        });
        return res.json(expiredQuotation);
      }
      throw createClientError(
        'Sent quotations cannot be edited. A customer-facing revision workflow is not available.',
        409
      );
    }
    if (quotation.status !== 'Draft') {
      throw createClientError('Only draft quotations can be edited.', 409);
    }

    const update = {};
    if (req.body.items !== undefined) {
      const request = await EventRequest.findById(quotation.request);
      if (!request) {
        throw createClientError('Related customer request not found.', 404);
      }
      update.items = normalizeItems(request.items, req.body.items);
    }
    Object.assign(update, normalizeAdjustments(req.body, quotation));

    if (req.body.notes !== undefined) {
      update.notes = readText(req.body.notes, { min: 0, max: 2000 });
      if (update.notes === null) throw createClientError('Quotation notes exceed the allowed length.');
    }
    if (req.body.validityDate !== undefined) {
      update.validityDate = normalizeValidityDate(req.body.validityDate);
    }

    if (req.body.status !== undefined) {
      if (!['Draft', 'Sent'].includes(req.body.status)) {
        throw createClientError('Invalid quotation status transition.', 409);
      }
      update.status = req.body.status;
    }

    const calculatedItems = update.items || quotation.items;
    update.finalTotal = calculateQuotationTotal(
      calculatedItems,
      {
        decorationServices: update.decorationServices,
        transportation: update.transportation,
        discount: update.discount,
        additionalCharges: update.additionalCharges
      }
    );

    if (update.status === 'Sent') {
      session = await mongoose.startSession();
      let updatedQuotation;
      await session.withTransaction(async () => {
        const requestUpdate = await EventRequest.updateOne(
          { _id: quotation.request, status: 'Quotation Draft' },
          { $set: { status: 'Quotation Sent' } },
          { session }
        );
        if (requestUpdate.matchedCount !== 1) {
          throw createClientError('Customer request status changed; reload and try again.', 409);
        }
        updatedQuotation = await Quotation.findOneAndUpdate(
          { _id: quotation._id, status: 'Draft' },
          { $set: update },
          { new: true, runValidators: true, session }
        );
        if (!updatedQuotation) {
          throw createClientError('Quotation status changed; reload and try again.', 409);
        }
      });
      return res.json(updatedQuotation);
    }

    const updatedQuotation = await Quotation.findOneAndUpdate(
      { _id: quotation._id, status: 'Draft' },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!updatedQuotation) {
      throw createClientError('Quotation status changed; reload and try again.', 409);
    }
    return res.json(updatedQuotation);
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

router.put('/quotations/:id/respond', authenticate, asyncHandler(async (req, res) => {
  let session;
  try {
    if (!isObjectId(req.params.id) || !isPlainObject(req.body)) {
      throw createClientError('Quotation ID or response body is invalid.');
    }
    const status = req.body.status;
    if (!['Accepted', 'Rejected'].includes(status)) {
      throw createClientError('Response status must be Accepted or Rejected.');
    }

    session = await mongoose.startSession();
    let updatedQuotation;
    let expired = false;
    await session.withTransaction(async () => {
      const quotation = await Quotation.findById(req.params.id).session(session);
      if (!quotation) {
        throw createClientError('Quotation not found.', 404);
      }
      if (quotation.customer.toString() !== req.user._id.toString()) {
        throw createClientError('Access denied.', 403);
      }
      const request = await EventRequest.findById(quotation.request).session(session);
      if (!request || request.user.toString() !== quotation.customer.toString()) {
        throw createClientError('Related customer request is inconsistent.', 409);
      }
      const requestStatus = status === 'Accepted' ? 'Quotation Accepted' : 'Rejected';
      if (quotation.status === status) {
        if (!isMatchingQuotationResponse(quotation.status, request.status, status)) {
          throw createClientError('Quotation and request statuses are inconsistent.', 409);
        }
        updatedQuotation = quotation;
        return;
      }
      if (quotation.status !== 'Sent') {
        throw createClientError('Only a sent quotation can be accepted or rejected.', 409);
      }
      if (quotation.validityDate && isValidityDateExpired(quotation.validityDate)) {
        const requestUpdate = await EventRequest.updateOne(
          { _id: quotation.request, user: quotation.customer, status: 'Quotation Sent' },
          { $set: { status: 'Quotation Expired' } },
          { session }
        );
        if (requestUpdate.matchedCount !== 1) {
          throw createClientError('Related customer request is no longer available.', 409);
        }
        quotation.status = 'Expired';
        updatedQuotation = await quotation.save({ session });
        expired = true;
        return;
      }

      const requestUpdate = await EventRequest.updateOne(
        { _id: quotation.request, user: quotation.customer, status: 'Quotation Sent' },
        { $set: { status: requestStatus } },
        { session }
      );
      if (requestUpdate.matchedCount !== 1) {
        throw createClientError('Related customer request is no longer available for a response.', 409);
      }

      quotation.status = status;
      updatedQuotation = await quotation.save({ session });
    });
    if (expired) {
      return res.status(409).json({ message: 'This quotation has expired.' });
    }
    return res.json(updatedQuotation);
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

router.normalizeItems = normalizeItems;
router.calculateQuotationTotal = calculateQuotationTotal;
router.normalizeValidityDate = normalizeValidityDate;
router.isValidityDateExpired = isValidityDateExpired;
router.isMatchingQuotationResponse = isMatchingQuotationResponse;

module.exports = router;
