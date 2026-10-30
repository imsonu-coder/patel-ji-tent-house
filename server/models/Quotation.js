const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventRequest',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    eventType: String,
    eventDates: {
      start: Date,
      end: Date
    },
    items: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
        unitPrice: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 }
      }
    ],
    decorationServices: { type: Number, default: 0, min: 0 },
    transportation: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    additionalCharges: { type: Number, default: 0, min: 0 },
    finalTotal: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' },
    validityDate: { type: Date },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'],
      default: 'Draft'
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

const Quotation = mongoose.model('Quotation', quotationSchema);
module.exports = Quotation;
