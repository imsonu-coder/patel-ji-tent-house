const express = require('express');
const GalleryImage = require('../models/GalleryImage');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const gallery = await GalleryImage.find({ status: 'active' }).sort({ createdAt: -1 });
  res.json(gallery);
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const image = await GalleryImage.create(req.body);
    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ message: 'Unable to add gallery image.', error: error.message });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const image = await GalleryImage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!image) return res.status(404).json({ message: 'Gallery image not found.' });
  res.json(image);
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const image = await GalleryImage.findByIdAndDelete(req.params.id);
  if (!image) return res.status(404).json({ message: 'Gallery image not found.' });
  res.json({ message: 'Image deleted.' });
});

module.exports = router;
