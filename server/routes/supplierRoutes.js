const express = require('express');
const Supplier = require('../models/Supplier');
const { authenticate, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const {
  isObjectId,
  isPlainObject,
  parseListLimit,
  readText,
  sendBoundedList,
  parsePagination,
  sendPaginatedList,
  sendRouteError
} = require('../utils/httpValidation');

const router = express.Router();
const allowedFields = new Set(['name', 'phone', 'email', 'address', 'categories', 'notes', 'status']);
const supplierStatuses = new Set(['active', 'inactive']);
const textFields = {
  name: 120,
  phone: 24,
  email: 254,
  address: 500,
  notes: 2000
};

const normalizeSupplierInput = (body, existing = {}) => {
  if (!isPlainObject(body) || Object.keys(body).some((field) => !allowedFields.has(field))) {
    const error = new Error('Supplier details contain unsupported fields.');
    error.statusCode = 400;
    throw error;
  }
  const result = {};
  for (const [field, max] of Object.entries(textFields)) {
    const value = body[field] === undefined ? existing[field] || '' : readText(body[field], { min: 0, max });
    if (value === null) {
      const error = new Error(`Supplier ${field} is invalid.`);
      error.statusCode = 400;
      throw error;
    }
    result[field] = field === 'email' ? value.toLowerCase() : value;
  }
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) {
    const error = new Error('Supplier email is invalid.');
    error.statusCode = 400;
    throw error;
  }
  if (result.phone && !/^\+?[\d ()-]+$/.test(result.phone)) {
    const error = new Error('Supplier phone is invalid.');
    error.statusCode = 400;
    throw error;
  }
  const categories = body.categories === undefined
    ? existing.categories || []
    : body.categories;
  if (
    !Array.isArray(categories)
    || categories.length > 30
    || categories.some((category) => !readText(category, { max: 60 }))
  ) {
    const error = new Error('Supplier categories are invalid.');
    error.statusCode = 400;
    throw error;
  }
  const status = body.status === undefined ? existing.status || 'active' : body.status;
  if (!supplierStatuses.has(status) || !result.name) {
    const error = new Error('Supplier name or status is invalid.');
    error.statusCode = 400;
    throw error;
  }
  return { ...result, categories, status };
};

router.get('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultPageSize: 20, maxPageSize: 100 });
  if (!pagination) return res.status(400).json({ message: 'Supplier list pagination is invalid.' });
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  const [suppliers, total] = await Promise.all([
    Supplier.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.pageSize),
    Supplier.countDocuments(filter)
  ]);
  return sendPaginatedList(res, suppliers, pagination, total);
}));

router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  try {
    const supplier = await Supplier.create(normalizeSupplierInput(req.body));
    return res.status(201).json(supplier);
  } catch (error) {
    return sendRouteError(res, error, 'Unable to add supplier.');
  }
}));

router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Supplier ID is invalid.' });
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });
    Object.assign(supplier, normalizeSupplierInput(req.body, supplier));
    await supplier.save();
    return res.json(supplier);
  } catch (error) {
    return sendRouteError(res, error, 'Unable to update supplier.');
  }
}));

router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Supplier ID is invalid.' });
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });
    return res.json({ message: 'Supplier deleted.' });
  } catch (error) {
    return sendRouteError(res, error, 'Unable to delete supplier.');
  }
}));

router.normalizeSupplierInput = normalizeSupplierInput;
module.exports = router;
