const mongoose = require('mongoose');

const contactEnquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new'
    }
  },
  { timestamps: true }
);

const ContactEnquiry = mongoose.model('ContactEnquiry', contactEnquirySchema);
module.exports = ContactEnquiry;
