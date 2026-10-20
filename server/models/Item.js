const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    description: {
      type: String,
      required: true
    },
    images: [{ type: String }],
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    priceUnit: {
      type: String,
      enum: ['Per Piece', 'Per Day', 'Per Unit', 'Per Setup', 'Fixed', 'Other'],
      default: 'Per Unit'
    },
    ownStock: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  { timestamps: true }
);

itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ name: 'text', description: 'text' });

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;
