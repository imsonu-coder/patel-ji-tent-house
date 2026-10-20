const express = require('express');
const Quotation = require('../models/Quotation');
const EventRequest = require('../models/EventRequest');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/admin/quotations', authenticate, requireAdmin, async (req, res) => {
  try {
    const quotation = await Quotation.create(req.body);
    await EventRequest.findByIdAndUpdate(req.body.request, { status: 'Quotation Sent' });
    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create quotation.', error: error.message });
  }
});

router.get('/quotations/my', authenticate, async (req, res) => {
  const quotations = await Quotation.find({ customer: req.user._id }).sort({ createdAt: -1 });
  res.json(quotations);
});

router.put('/admin/quotations/:id', authenticate, requireAdmin, async (req, res) => {
  const quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });
  res.json(quotation);
});

router.put('/quotations/:id/respond', authenticate, async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

  if (quotation.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  quotation.status = req.body.status || 'Accepted';
  await quotation.save();

  if (quotation.status === 'Accepted') {
    await EventRequest.findByIdAndUpdate(quotation.request, { status: 'Confirmed' });
  }

  res.json(quotation);
});

module.exports = router;
