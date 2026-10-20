const mongoose = require('mongoose');

const supplierArrangementSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'EventRequest', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    source: { type: String, default: 'External' },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled'],
      default: 'Pending'
    }
  },
  { timestamps: true }
);

const SupplierArrangement = mongoose.model('SupplierArrangement', supplierArrangementSchema);
module.exports = SupplierArrangement;
