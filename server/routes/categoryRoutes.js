const express = require('express');
const Category = require('../models/Category');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const categories = await Category.find({}).sort({ name: 1 });
  res.json(categories);
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const category = await Category.create({ name, slug, description });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create category.', error: error.message });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update category.', error: error.message });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete category.', error: error.message });
  }
});

module.exports = router;
