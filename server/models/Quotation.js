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
        itemName: String,
        quantity: Number,
        unitPrice: Number,
        subtotal: Number
      }
    ],
    decorationServices: { type: Number, default: 0 },
    transportation: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    finalTotal: { type: Number, required: true },
    notes: { type: String, default: '' },
    validityDate: { type: Date },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'],
      default: 'Draft'
    }
  },
  { timestamps: true }
);

const Quotation = mongoose.model('Quotation', quotationSchema);
module.exports = Quotation;
