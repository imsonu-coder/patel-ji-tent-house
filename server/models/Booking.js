const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventRequest',
      required: true
    },
    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation'
    },
    eventDates: {
      start: Date,
      end: Date
    },
    location: String,
    items: [{
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
      itemName: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1, validate: Number.isInteger }
    }],
    finalAmount: { type: Number, default: 0, min: 0 },
    inventoryVerificationStatus: {
      type: String,
      enum: ['Verified', 'UnverifiedLegacy']
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    isSynthetic: {
      type: Boolean,
      default: false,
      index: true
    },
    syntheticId: {
      type: String,
      sparse: true,
      index: true
    }
  },
  { timestamps: true }
);

bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index(
  { request: 1 },
  { unique: true, partialFilterExpression: { request: { $type: 'objectId' } } }
);
const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
