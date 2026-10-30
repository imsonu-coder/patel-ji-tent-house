const express = require('express');
const Item = require('../models/Item');
const Category = require('../models/Category');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  escapeRegex,
  isObjectId,
  isPlainObject,
  parsePagination,
  readNonNegativeNumber,
  readText,
  sendPaginatedList,
  sendRouteError
} = require('../utils/httpValidation');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (req.query.status === 'all') {
      // allow all statuses
    } else if (req.query.status && ['active', 'inactive'].includes(req.query.status)) {
      filter.status = req.query.status;
    } else {
      filter.status = 'active';
    }
    if (req.query.scope === 'synthetic') {
      filter.isSynthetic = true;
    } else if (req.query.scope === 'real') {
      filter.isSynthetic = { $ne: true };
    }
    const pagination = parsePagination(req.query);
    if (!pagination) return res.status(400).json({ message: 'Item pagination is invalid.' });

    if (category && category !== 'All') {
      if (typeof category !== 'string' || category.length > 100) {
        return res.status(400).json({ message: 'Category filter is invalid.' });
      }
      const safeCategory = escapeRegex(category.trim());
      const categoryDoc = await Category.findOne({
        $or: [
          { name: { $regex: new RegExp('^' + safeCategory, 'i') } },
          { slug: { $regex: new RegExp('^' + safeCategory, 'i') } }
        ]
      });
      if (categoryDoc) filter.category = categoryDoc._id;
    }

    if (search) {
      if (typeof search !== 'string' || search.length > 80) {
        return res.status(400).json({ message: 'Search query is too long.' });
      }
      const safeSearch = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const [items, total] = await Promise.all([
      Item.find(filter).populate('category').sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.pageSize),
      Item.countDocuments(filter)
    ]);
    sendPaginatedList(res, items, pagination, total);
  } catch (error) {
    sendRouteError(res, error, 'Unable to fetch items.');
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Item ID is invalid.' });
    }
    const item = await Item.findById(req.params.id).populate('category');
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    res.json(item);
  } catch (error) {
    sendRouteError(res, error, 'Unable to fetch item.');
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      return res.status(400).json({ message: 'Item details must be an object.' });
    }
    const { name, category, description, images, basePrice, priceUnit, ownStock, status } = req.body;
    const normalizedName = readText(name, { max: 120 });
    const normalizedDescription = readText(description, { max: 4000 });
    const price = readNonNegativeNumber(basePrice);
    const stock = ownStock === undefined ? 0 : readNonNegativeNumber(ownStock, { integer: true });
    if (
      !normalizedName
      || !normalizedDescription
      || !category
      || basePrice === undefined
      || price === null
      || stock === null
      || (status !== undefined && !['active', 'inactive'].includes(status))
      || (priceUnit !== undefined && !['Per Piece', 'Per Day', 'Per Unit', 'Per Setup', 'Fixed', 'Other'].includes(priceUnit))
      || (images !== undefined && (!Array.isArray(images) || images.length > 20 || images.some((image) => typeof image !== 'string' || image.length > 2048)))
    ) {
      return res.status(400).json({ message: 'Item details contain invalid fields.' });
    }

    const categoryDoc = isObjectId(String(category))
      ? await Category.findById(category)
      : await Category.findOne({ name: String(category).trim() });
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Valid category is required.' });
    }

    const item = await Item.create({
      name: normalizedName,
      category: categoryDoc._id,
      description: normalizedDescription,
      images: images || [],
      basePrice: price,
      priceUnit: priceUnit || 'Per Unit',
      ownStock: stock,
      status: status || 'active'
    });

    res.status(201).json(item);
  } catch (error) {
    sendRouteError(res, error, 'Unable to create item.');
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    if (!isObjectId(req.params.id) || !isPlainObject(req.body)) {
      return res.status(400).json({ message: 'Item ID or update body is invalid.' });
    }
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    const allowedFields = new Set([
      'name', 'category', 'description', 'images', 'basePrice', 'priceUnit', 'ownStock', 'status'
    ]);
    if (Object.keys(req.body).some((field) => !allowedFields.has(field))) {
      return res.status(400).json({ message: 'Item update contains unsupported fields.' });
    }

    if (req.body.name !== undefined) {
      const name = readText(req.body.name, { max: 120 });
      if (!name) return res.status(400).json({ message: 'Item name is invalid.' });
      item.name = name;
    }
    if (req.body.description !== undefined) {
      const description = readText(req.body.description, { max: 4000 });
      if (!description) return res.status(400).json({ message: 'Item description is invalid.' });
      item.description = description;
    }
    if (req.body.category !== undefined) {
      const categoryId = String(req.body.category);
      if (!isObjectId(categoryId)) return res.status(400).json({ message: 'Category ID is invalid.' });
      const category = await Category.findById(categoryId);
      if (!category) return res.status(400).json({ message: 'Valid category is required.' });
      item.category = category._id;
    }
    if (req.body.basePrice !== undefined) {
      const price = readNonNegativeNumber(req.body.basePrice);
      if (price === null) return res.status(400).json({ message: 'Price must be a non-negative amount.' });
      item.basePrice = price;
    }
    if (req.body.priceUnit !== undefined) {
      if (!['Per Piece', 'Per Day', 'Per Unit', 'Per Setup', 'Fixed', 'Other'].includes(req.body.priceUnit)) {
        return res.status(400).json({ message: 'Price unit is invalid.' });
      }
      item.priceUnit = req.body.priceUnit;
    }
    if (req.body.ownStock !== undefined) {
      const stock = readNonNegativeNumber(req.body.ownStock, { integer: true });
      if (stock === null) {
        return res.status(400).json({ message: 'Stock must be a non-negative whole number.' });
      }
      item.ownStock = stock;
    }
    if (req.body.status !== undefined) {
      if (!['active', 'inactive'].includes(req.body.status)) return res.status(400).json({ message: 'Item status is invalid.' });
      item.status = req.body.status;
    }
    if (req.body.images !== undefined) {
      if (!Array.isArray(req.body.images) || req.body.images.length > 20 || req.body.images.some((image) => typeof image !== 'string' || image.length > 2048)) {
        return res.status(400).json({ message: 'Item images are invalid.' });
      }
      item.images = req.body.images;
    }

    await item.save();
    res.json(item);
  } catch (error) {
    sendRouteError(res, error, 'Unable to update item.');
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Item ID is invalid.' });
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    res.json({ message: 'Item deleted successfully.' });
  } catch (error) {
    sendRouteError(res, error, 'Unable to delete item.');
  }
});

module.exports = router;
