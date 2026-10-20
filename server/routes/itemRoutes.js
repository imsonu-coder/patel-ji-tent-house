const express = require('express');
const Item = require('../models/Item');
const Category = require('../models/Category');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { status: 'active' };

    if (category && category !== 'All') {
      const categoryDoc = await Category.findOne({ name: category });
      if (categoryDoc) filter.category = categoryDoc._id;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Item.find(filter).populate('category').sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch items.', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('category');
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch item.', error: error.message });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, category, description, images, basePrice, priceUnit, ownStock, status } = req.body;
    if (!name || !category || !description || !basePrice) {
      return res.status(400).json({ message: 'Please provide name, category, description and price.' });
    }

    const categoryDoc = await Category.findById(category) || await Category.findOne({ name: category });
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Valid category is required.' });
    }

    const item = await Item.create({
      name,
      category: categoryDoc._id,
      description,
      images: images || [],
      basePrice,
      priceUnit: priceUnit || 'Per Unit',
      ownStock: ownStock || 0,
      status: status || 'active'
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create item.', error: error.message });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    const updates = req.body;
    Object.assign(item, updates);
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update item.', error: error.message });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    res.json({ message: 'Item deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete item.', error: error.message });
  }
});

module.exports = router;
