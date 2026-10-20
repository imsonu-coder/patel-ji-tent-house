const express = require('express');
const Supplier = require('../models/Supplier');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireAdmin, async (req, res) => {
  const suppliers = await Supplier.find({}).sort({ createdAt: -1 });
  res.json(suppliers);
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Unable to add supplier.', error: error.message });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update supplier.', error: error.message });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const supplier = await Supplier.findByIdAndDelete(req.params.id);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });
  res.json({ message: 'Supplier deleted.' });
});

module.exports = router;
