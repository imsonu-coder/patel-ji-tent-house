const mongoose = require('mongoose');

const supplierArrangementSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'EventRequest', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    supplierCommitmentReference: {
      type: String,
      trim: true,
      validate: (value) => value == null || value.length > 0
    },
    supplierCommitmentLineIdentity: {
      type: String,
      trim: true,
      validate: (value) => value == null || value.length > 0
    },
    commitmentVerificationStatus: {
      type: String,
      enum: ['Verified', 'UnverifiedLegacy']
    },
    commitmentVerifiedAt: Date,
    commitmentVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commitmentVerificationEvidenceReference: { type: String, trim: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    eventDates: {
      start: Date,
      end: Date
    },
    confirmedQuantity: {
      type: Number,
      min: 0,
      validate: {
        validator(value) {
          return value == null || (Number.isInteger(value) && value <= this.quantity);
        },
        message: 'Confirmed quantity must be a non-negative integer no greater than requested quantity.'
      }
    },
    supplyStatus: {
      type: String,
      enum: ['Pending', 'SupplierConfirmed', 'SupplierDeclined', 'Cancelled']
    },
    allocationStatus: {
      type: String,
      enum: ['Unreserved', 'Reserved', 'Released']
    },
    supplyConfirmedAt: Date,
    supplyConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supplyCancelledAt: Date,
    supplyCancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancellationReviewStatus: {
      type: String,
      enum: ['NotRequested', 'PendingReview', 'SupplierConfirmed', 'AdminResolved']
    },
    cancellationResolvedAt: Date,
    cancellationResolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancellationResolutionReason: { type: String, trim: true },
    allocatedAt: Date,
    allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    releasedAt: Date,
    releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    releaseReason: { type: String, trim: true },
    source: { type: String, default: 'External' },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled'],
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

supplierArrangementSchema.pre('validate', function validateEventDates(next) {
  if (this.commitmentVerificationStatus === 'Verified') {
    if (
      !this.supplierCommitmentReference
      || !this.supplierCommitmentReference.trim()
      || !this.supplierCommitmentLineIdentity
      || !this.supplierCommitmentLineIdentity.trim()
      || !this.item
      || !this.eventDates?.start
      || !this.eventDates?.end
      || !this.commitmentVerifiedAt
      || !this.commitmentVerifiedBy
      || !this.commitmentVerificationEvidenceReference?.trim()
    ) {
      this.invalidate(
        'commitmentVerificationStatus',
        'Verified supplier commitments require a supplier reference, line identity, item, event dates, verification audit, and evidence reference.'
      );
    }
  }

  // These fields establish audit structure only; they do not prove that the
  // supplier identity or external commitment was genuinely reviewed.
  if (
    this.commitmentVerificationStatus === 'UnverifiedLegacy'
    && (this.commitmentVerifiedAt || this.commitmentVerifiedBy || this.commitmentVerificationEvidenceReference)
  ) {
    this.invalidate(
      'commitmentVerificationStatus',
      'Unverified legacy commitments cannot carry verified commitment audit fields.'
    );
  }

  if (
    this.supplyStatus === 'SupplierConfirmed'
    && (
      !Number.isInteger(this.confirmedQuantity)
      || this.confirmedQuantity < 1
      || !this.supplyConfirmedAt
      || !this.supplyConfirmedBy
      || !this.item
      || !this.eventDates?.start
      || !this.eventDates?.end
      || this.commitmentVerificationStatus !== 'Verified'
    )
  ) {
    this.invalidate(
      'supplyStatus',
      'Supplier-confirmed supply requires a verified commitment identity, item, event dates, positive confirmed quantity, confirmation time, and administrator.'
    );
  }

  if (
    this.allocationStatus === 'Reserved'
    && (!this.booking || !this.item || !this.eventDates?.start || !this.eventDates?.end || !this.allocatedAt || !this.allocatedBy)
  ) {
    this.invalidate(
      'allocationStatus',
      'Reserved arrangements require a booking, item, event dates, allocation time, and administrator.'
    );
  }

  if (
    this.allocationStatus === 'Released'
    && (!this.releasedAt || !this.releasedBy || !this.releaseReason)
  ) {
    this.invalidate(
      'allocationStatus',
      'Released arrangements require a release time, administrator, and reason.'
    );
  }

  if (
    ['SupplierConfirmed', 'AdminResolved'].includes(this.cancellationReviewStatus)
    && (!this.cancellationResolvedAt || !this.cancellationResolvedBy || !this.cancellationResolutionReason?.trim())
  ) {
    this.invalidate(
      'cancellationReviewStatus',
      'Resolved supplier cancellation requires a resolution time, administrator, and reason.'
    );
  }
  if (
    this.cancellationReviewStatus === 'PendingReview'
    && (this.cancellationResolvedAt || this.cancellationResolvedBy || this.cancellationResolutionReason)
  ) {
    this.invalidate(
      'cancellationReviewStatus',
      'Pending supplier cancellation review cannot include resolution audit fields.'
    );
  }

  if (
    this.eventDates?.start
    && this.eventDates?.end
    && this.eventDates.end < this.eventDates.start
  ) {
    this.invalidate('eventDates.end', 'Event end date must be on or after the start date.');
  }
  next();
});

supplierArrangementSchema.index(
  {
    supplier: 1,
    supplierCommitmentReference: 1,
    supplierCommitmentLineIdentity: 1,
    item: 1,
    'eventDates.start': 1,
    'eventDates.end': 1
  },
  {
    unique: true,
    partialFilterExpression: {
      commitmentVerificationStatus: 'Verified',
      supplierCommitmentReference: { $type: 'string' },
      supplierCommitmentLineIdentity: { $type: 'string' },
      item: { $type: 'objectId' },
      'eventDates.start': { $type: 'date' },
      'eventDates.end': { $type: 'date' }
    }
  }
);

const SupplierArrangement = mongoose.model('SupplierArrangement', supplierArrangementSchema);
module.exports = SupplierArrangement;
