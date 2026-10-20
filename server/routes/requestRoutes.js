const express = require('express');
const EventRequest = require('../models/EventRequest');
const Item = require('../models/Item');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const createRequestId = () => `PJTH-${Math.floor(1000 + Math.random() * 9000)}`;

router.post('/requests', authenticate, async (req, res) => {
  try {
    const { eventType, startDate, endDate, location, guestCount, additionalRequirements, description, items } = req.body;

    if (!eventType || !startDate || !endDate || !location || !guestCount) {
      return res.status(400).json({ message: 'Event details are incomplete.' });
    }

    const normalizedItems = await Promise.all(
      (items || []).map(async (entry) => {
        const itemDoc = await Item.findById(entry.itemId || entry.item);
        if (!itemDoc) throw new Error('Item not found');
        const quantity = Number(entry.quantity || 1);
        const unitPrice = Number(itemDoc.basePrice || 0);
        const estimatedPrice = unitPrice * quantity;
        return {
          item: itemDoc._id,
          itemName: itemDoc.name,
          quantity,
          unitPrice,
          estimatedPrice
        };
      })
    );

    const estimatedAmount = normalizedItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);

    const request = await EventRequest.create({
      user: req.user._id,
      requestId: createRequestId(),
      eventType,
      startDate,
      endDate,
      location,
      guestCount,
      additionalRequirements: additionalRequirements || '',
      description: description || '',
      items: normalizedItems,
      estimatedAmount
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Requirement could not be submitted.', error: error.message });
  }
});

router.get('/requests/my', authenticate, async (req, res) => {
  const requests = await EventRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(requests);
});

router.get('/requests/:id', authenticate, async (req, res) => {
  const request = await EventRequest.findById(req.params.id).populate('user', 'name email phone');
  if (!request) return res.status(404).json({ message: 'Request not found.' });

  if (req.user.role !== 'admin' && request.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You do not have access to this request.' });
  }

  res.json(request);
});

router.get('/admin/requests', authenticate, requireAdmin, async (req, res) => {
  const requests = await EventRequest.find({}).populate('user', 'name email phone').sort({ createdAt: -1 });
  res.json(requests);
});

router.put('/admin/requests/:id/status', authenticate, requireAdmin, async (req, res) => {
  const { status, note } = req.body;
  const request = await EventRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found.' });

  request.status = status || request.status;
  if (note) request.notes.push(note);
  await request.save();

  res.json(request);
});

module.exports = router;
