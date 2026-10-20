const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Weddings', 'Tents', 'Decoration', 'Lighting', 'Furniture', 'Other'],
      default: 'Other'
    },
    description: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  { timestamps: true }
);

const GalleryImage = mongoose.model('GalleryImage', galleryImageSchema);
module.exports = GalleryImage;
