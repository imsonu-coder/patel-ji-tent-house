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
    items: [{ itemName: String, quantity: Number }],
    finalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Confirmed', 'Completed', 'Cancelled'],
      default: 'Confirmed'
    }
  },
  { timestamps: true }
);

bookingSchema.index({ customer: 1, createdAt: -1 });
const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
