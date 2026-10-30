const mongoose = require('mongoose');

const inventoryReturnInspectionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryReservation',
      required: true
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    returnedQuantity: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger
    },
    inspectionOutcome: {
      type: String,
      enum: ['Passed', 'Failed', 'Damaged', 'NeedsRepair'],
      required: true
    },
    inspectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    inspectedAt: {
      type: Date,
      required: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    releaseStatus: {
      type: String,
      enum: ['NotReleased', 'Released'],
      default: 'NotReleased',
      required: true
    },
    releasedQuantity: {
      type: Number,
      min: 0,
      default: 0,
      validate: Number.isInteger
    },
    releaseIdempotencyKey: {
      type: String,
      trim: true,
      validate: (value) => value == null || value.trim().length > 0
    },
    releasedAt: Date,
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

inventoryReturnInspectionSchema.pre('validate', function validateRelease(next) {
  if (this.releasedQuantity > this.returnedQuantity) {
    this.invalidate('releasedQuantity', 'Released quantity cannot exceed returned quantity.');
  }
  if (this.releasedQuantity > 0 && this.inspectionOutcome !== 'Passed') {
    this.invalidate('releasedQuantity', 'Only passed inspections can release owned equipment.');
  }
  if (this.releaseStatus === 'Released') {
    if (this.inspectionOutcome !== 'Passed') {
      this.invalidate('releaseStatus', 'Only passed inspections can be marked released.');
    }
    if (
      this.releasedQuantity < 1
      || !this.releasedAt
      || !this.releasedBy
    ) {
      this.invalidate('releaseStatus', 'Released inspections require a positive released quantity, time, and administrator.');
    }
    if (!this.releaseIdempotencyKey?.trim()) {
      this.invalidate('releaseIdempotencyKey', 'Released inspections require a release idempotency key.');
    }
  } else if (this.releasedQuantity > 0 || this.releasedAt || this.releasedBy) {
    this.invalidate('releaseStatus', 'Release details require the Released state.');
  }
  if (this.releaseStatus !== 'Released' && this.releaseIdempotencyKey) {
    this.invalidate('releaseIdempotencyKey', 'Release idempotency keys are only valid for released inspections.');
  }
  next();
});

inventoryReturnInspectionSchema.index({ reservation: 1, createdAt: 1 });
inventoryReturnInspectionSchema.index({ booking: 1, item: 1, createdAt: 1 });
inventoryReturnInspectionSchema.index(
  { reservation: 1, releaseIdempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { releaseIdempotencyKey: { $type: 'string' } }
  }
);

const InventoryReturnInspection = mongoose.model(
  'InventoryReturnInspection',
  inventoryReturnInspectionSchema
);
module.exports = InventoryReturnInspection;
