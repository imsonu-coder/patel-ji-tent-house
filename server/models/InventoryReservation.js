const mongoose = require('mongoose');

const preDispatchVerificationSchema = new mongoose.Schema(
  {
    confirmedNeverDispatched: { type: Boolean, required: true, validate: (value) => value === true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryReservation', required: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    reason: { type: String, required: true, trim: true },
    verifiedAt: { type: Date, required: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { _id: false }
);

const inventoryReservationSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger
    },
    eventDates: {
      start: { type: Date, required: true },
      end: { type: Date, required: true }
    },
    source: {
      type: String,
      enum: ['Owned', 'Supplier'],
      required: true
    },
    supplierArrangement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplierArrangement'
    },
    allocationIdempotencyKey: {
      type: String,
      trim: true,
      validate: (value) => value == null || value.length > 0
    },
    status: {
      type: String,
      enum: ['Reserved', 'Released'],
      default: 'Reserved',
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    releasedAt: Date,
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    releasedQuantity: {
      type: Number,
      min: 0,
      validate: {
        validator(value) {
          return value == null || (
            Number.isInteger(value)
            && value <= this.quantity
          );
        },
        message: 'Released quantity must be a non-negative integer no greater than the reservation quantity.'
      }
    },
    releaseType: {
      type: String,
      enum: ['PreDispatchCancellation', 'ReturnInspection', 'SupplierCancellationResolution']
    },
    preDispatchVerification: preDispatchVerificationSchema,
    releaseReason: {
      type: String,
      trim: true
    },
    releaseInspection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryReturnInspection'
    },
    provenance: {
      type: String,
      enum: ['NewWorkflow', 'ManualReconciliation', 'LegacyUnverified'],
      required: true,
      default: 'LegacyUnverified'
    },
    verificationStatus: {
      type: String,
      enum: ['Verified', 'LegacyUnverified'],
      required: true,
      default: 'LegacyUnverified'
    },
    verificationEvidenceReference: { type: String, trim: true },
    verifiedAt: Date,
    verifiedBy: {
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

inventoryReservationSchema.pre('validate', function validateReservation(next) {
  if (this.eventDates?.start && this.eventDates?.end && this.eventDates.end < this.eventDates.start) {
    this.invalidate('eventDates.end', 'Event end date must be on or after the start date.');
  }

  if (this.source === 'Supplier' && !this.supplierArrangement) {
    this.invalidate('supplierArrangement', 'Supplier reservations require a supplier arrangement.');
  }
  if (this.source === 'Owned' && this.supplierArrangement) {
    this.invalidate('supplierArrangement', 'Owned reservations cannot reference a supplier arrangement.');
  }

  const releaseFieldsPresent = Boolean(
    this.releaseType
    || this.releasedAt
    || this.releasedBy
    || this.releaseInspection
    || this.preDispatchVerification
    || this.releaseReason
    || this.releasedQuantity != null
  );
  if (this.status === 'Reserved' && releaseFieldsPresent) {
    this.invalidate('status', 'Reserved reservations cannot include release state or audit fields.');
  }
  if (this.status === 'Released') {
    if (!this.releasedAt || !this.releasedBy) {
      this.invalidate('status', 'Released reservations require release time and administrator.');
    }
    if (this.verificationStatus !== 'Verified') {
      this.invalidate('status', 'Legacy-unverified reservations cannot be marked released.');
    }
    if (!this.releaseType || !this.releaseReason?.trim()) {
      this.invalidate('releaseType', 'Released reservations require a release type and reason.');
    }
    if (!Number.isInteger(this.releasedQuantity) || this.releasedQuantity < 1) {
      this.invalidate('releasedQuantity', 'Released reservations require a positive integer released quantity.');
    }
    if (this.releasedQuantity !== this.quantity) {
      this.invalidate('releasedQuantity', 'Released reservations must have their full quantity released.');
    }
  }
  if (this.releaseType === 'PreDispatchCancellation' && this.source !== 'Owned') {
    this.invalidate('releaseType', 'Pre-dispatch cancellation release applies only to owned reservations.');
  }
  if (this.releaseType === 'SupplierCancellationResolution' && this.source !== 'Supplier') {
    this.invalidate('releaseType', 'Supplier cancellation resolution applies only to supplier reservations.');
  }
  if (this.preDispatchVerification) {
    const verification = this.preDispatchVerification;
    if (
      this.status !== 'Released'
      || this.source !== 'Owned'
      || this.releaseType !== 'PreDispatchCancellation'
      || this.releaseInspection
    ) {
      this.invalidate(
        'preDispatchVerification',
        'Non-dispatch verification is only valid for an owned pre-dispatch release without a return inspection.'
      );
    }
    if (
      this.status !== 'Released'
      || verification.booking?.toString() !== this.booking?.toString()
      || verification.quantity > this.quantity
      || verification.quantity !== this.releasedQuantity
      || !verification.reason?.trim()
      || !verification.verifiedAt
      || !verification.verifiedBy
    ) {
      this.invalidate(
        'preDispatchVerification',
        'Non-dispatch release requires a matching booking reference, matching allowed quantity, reason, timestamp, and administrator.'
      );
    }
  }
  if (this.releaseType === 'PreDispatchCancellation' && !this.preDispatchVerification) {
    this.invalidate('preDispatchVerification', 'Pre-dispatch cancellation release requires a verified non-dispatch checklist.');
  }
  if (this.releaseType === 'ReturnInspection' && (
    this.status !== 'Released'
    || this.source !== 'Owned'
    || !this.releaseInspection
    || this.preDispatchVerification
  )) {
    this.invalidate(
      'releaseInspection',
      'Return-inspection release requires a released owned reservation with an inspection reference and no pre-dispatch verification.'
    );
  }
  if (this.releaseType === 'SupplierCancellationResolution' && (
    this.status !== 'Released'
    || this.source !== 'Supplier'
    || this.releaseInspection
    || this.preDispatchVerification
  )) {
    this.invalidate(
      'releaseType',
      'Supplier cancellation release requires a released supplier reservation without owned-equipment inspection fields.'
    );
  }
  if (this.verificationStatus === 'Verified' && (!this.verifiedAt || !this.verifiedBy)) {
    this.invalidate('verificationStatus', 'Verified reservations require verification time and administrator.');
  }
  if (
    this.verificationStatus === 'Verified'
    && this.provenance === 'ManualReconciliation'
    && !this.verificationEvidenceReference?.trim()
  ) {
    this.invalidate(
      'verificationEvidenceReference',
      'Manually reconciled reservations require a verification evidence reference.'
    );
  }
  // Verification fields document an assertion; the service must validate the
  // evidence and referenced records before treating it as reconciled inventory.
  if (
    this.verificationStatus === 'LegacyUnverified'
    && (this.verifiedAt || this.verifiedBy || this.verificationEvidenceReference)
  ) {
    this.invalidate(
      'verificationStatus',
      'Legacy-unverified reservations cannot include verified audit fields.'
    );
  }
  if (
    this.provenance === 'LegacyUnverified'
    && this.verificationStatus !== 'LegacyUnverified'
  ) {
    this.invalidate('verificationStatus', 'Legacy-unverified provenance must remain unverified.');
  }
  if (
    this.provenance !== 'LegacyUnverified'
    && this.verificationStatus !== 'Verified'
  ) {
    this.invalidate('verificationStatus', 'New and manually reconciled reservations must be verified.');
  }

  // Persisted reservation/item/booking matching and remaining quantity require
  // trusted records and must be enforced by the future transactional service.
  next();
});

inventoryReservationSchema.index({ item: 1, status: 1, 'eventDates.start': 1, 'eventDates.end': 1 });
inventoryReservationSchema.index({ booking: 1, status: 1 });
inventoryReservationSchema.index({ supplierArrangement: 1, status: 1 });
inventoryReservationSchema.index(
  { booking: 1, allocationIdempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { allocationIdempotencyKey: { $type: 'string' } }
  }
);

const InventoryReservation = mongoose.model('InventoryReservation', inventoryReservationSchema);
module.exports = InventoryReservation;
