const mongoose = require('mongoose');

const eventRequestItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, default: 0 },
    estimatedPrice: { type: Number, default: 0 }
  },
  { _id: true }
);

const eventRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    eventType: {
      type: String,
      required: true,
      enum: ['Wedding', 'Engagement', 'Birthday', 'Reception', 'Corporate', 'Religious', 'Other']
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1
    },
    additionalRequirements: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    items: [eventRequestItemSchema],
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Quotation Draft', 'Quotation Sent', 'Quotation Accepted', 'Quotation Expired', 'Confirmed', 'Completed', 'Rejected', 'Cancelled'],
      default: 'Submitted'
    },
    estimatedAmount: {
      type: Number,
      default: 0
    },
    notes: [{ type: String }],
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

eventRequestSchema.index({ user: 1, createdAt: -1 });
eventRequestSchema.index({ status: 1, startDate: 1 });

const EventRequest = mongoose.model('EventRequest', eventRequestSchema);
module.exports = EventRequest;
