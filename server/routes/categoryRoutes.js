const express = require('express');
const Category = require('../models/Category');
const { authenticate, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const {
  isObjectId,
  isPlainObject,
  parsePagination,
  readText,
  sendPaginatedList,
  sendRouteError
} = require('../utils/httpValidation');

const router = express.Router();
const categoryStatuses = new Set(['active', 'inactive']);

router.get('/', asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  if (!pagination) return res.status(400).json({ message: 'Category pagination is invalid.' });
  const [categories, total] = await Promise.all([
    Category.find({}).sort({ name: 1 }).skip(pagination.skip).limit(pagination.pageSize),
    Category.countDocuments()
  ]);
  return sendPaginatedList(res, categories, pagination, total);
}));

router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  try {
    if (!isPlainObject(req.body)) return res.status(400).json({ message: 'Category details must be an object.' });
    const name = readText(req.body.name, { max: 100 });
    const description = req.body.description === undefined
      ? ''
      : readText(req.body.description, { min: 0, max: 1000 });
    if (!name || description === null || (req.body.status !== undefined && !categoryStatuses.has(req.body.status))) {
      return res.status(400).json({ message: 'Category details contain invalid fields.' });
    }
    const category = await Category.create({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      ...(req.body.status ? { status: req.body.status } : {})
    });
    return res.status(201).json(category);
  } catch (error) {
    return sendRouteError(res, error, 'Unable to create category.');
  }
}));

router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  try {
    if (!isObjectId(req.params.id) || !isPlainObject(req.body)) {
      return res.status(400).json({ message: 'Category ID or update body is invalid.' });
    }
    const allowed = new Set(['name', 'description', 'status']);
    if (Object.keys(req.body).some((field) => !allowed.has(field))) {
      return res.status(400).json({ message: 'Category update contains unsupported fields.' });
    }
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    if (req.body.name !== undefined) {
      const name = readText(req.body.name, { max: 100 });
      if (!name) return res.status(400).json({ message: 'Category name is invalid.' });
      category.name = name;
      category.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (req.body.description !== undefined) {
      const description = readText(req.body.description, { min: 0, max: 1000 });
      if (description === null) return res.status(400).json({ message: 'Category description is invalid.' });
      category.description = description;
    }
    if (req.body.status !== undefined) {
      if (!categoryStatuses.has(req.body.status)) return res.status(400).json({ message: 'Category status is invalid.' });
      category.status = req.body.status;
    }
    await category.save();
    return res.json(category);
  } catch (error) {
    return sendRouteError(res, error, 'Unable to update category.');
  }
}));

router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Category ID is invalid.' });
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    return res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    return sendRouteError(res, error, 'Unable to delete category.');
  }
}));

module.exports = router;
