const express = require('express');
const GalleryImage = require('../models/GalleryImage');
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
const galleryCategories = new Set(['Weddings', 'Tents', 'Decoration', 'Lighting', 'Furniture', 'Other']);
const galleryStatuses = new Set(['active', 'inactive']);
const allowedFields = new Set(['title', 'category', 'description', 'imageUrl', 'status']);

const normalizeGalleryInput = (body, existing = {}) => {
  if (!isPlainObject(body) || Object.keys(body).some((field) => !allowedFields.has(field))) {
    const error = new Error('Gallery details contain unsupported fields.');
    error.statusCode = 400;
    throw error;
  }
  const title = body.title === undefined
    ? existing.title
    : readText(body.title, { max: 160 });
  const category = body.category === undefined ? existing.category || 'Other' : body.category;
  const description = body.description === undefined
    ? existing.description || ''
    : readText(body.description, { min: 0, max: 2000 });
  const imageUrl = body.imageUrl === undefined
    ? existing.imageUrl
    : readText(body.imageUrl, { max: 2048 });
  const status = body.status === undefined ? existing.status || 'active' : body.status;
  const validImageUrl = typeof imageUrl === 'string'
    && (imageUrl.startsWith('/') && !imageUrl.startsWith('//')
      || /^https?:\/\/\S+$/i.test(imageUrl));

  if (
    !title
    || !galleryCategories.has(category)
    || description === null
    || !validImageUrl
    || !galleryStatuses.has(status)
  ) {
    const error = new Error('Gallery details contain invalid fields.');
    error.statusCode = 400;
    throw error;
  }
  return { title, category, description, imageUrl, status };
};

router.get('/', asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  if (!pagination) return res.status(400).json({ message: 'Gallery pagination is invalid.' });
  const filter = {};
  if (req.query.status === 'all') {
    // allow all
  } else if (req.query.status && ['active', 'inactive'].includes(req.query.status)) {
    filter.status = req.query.status;
  } else {
    filter.status = 'active';
  }
  const [gallery, total] = await Promise.all([
    GalleryImage.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.pageSize),
    GalleryImage.countDocuments(filter)
  ]);
  return sendPaginatedList(res, gallery, pagination, total);
}));

router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  try {
    const image = await GalleryImage.create(normalizeGalleryInput(req.body));
    return res.status(201).json(image);
  } catch (error) {
    return sendRouteError(res, error, 'Unable to add gallery image.');
  }
}));

router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Gallery image ID is invalid.' });
    const image = await GalleryImage.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Gallery image not found.' });
    Object.assign(image, normalizeGalleryInput(req.body, image));
    await image.save();
    return res.json(image);
  } catch (error) {
    return sendRouteError(res, error, 'Unable to update gallery image.');
  }
}));

router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Gallery image ID is invalid.' });
    const image = await GalleryImage.findByIdAndDelete(req.params.id);
    if (!image) return res.status(404).json({ message: 'Gallery image not found.' });
    return res.json({ message: 'Image deleted.' });
  } catch (error) {
    return sendRouteError(res, error, 'Unable to delete gallery image.');
  }
}));

router.normalizeGalleryInput = normalizeGalleryInput;
module.exports = router;
