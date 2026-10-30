const mongoose = require('mongoose');

const reconciliationChecklistSchema = new mongoose.Schema(
  {
    historicalBookingsReviewed: { type: Boolean, default: false },
    supplierCommitmentsReviewed: { type: Boolean, default: false },
    duplicateRecordsReviewed: { type: Boolean, default: false },
    unresolvedAllocationsReviewed: { type: Boolean, default: false },
    itemStockQuantitiesVerified: { type: Boolean, default: false },
    outstandingReturnsReviewed: { type: Boolean, default: false },
    evidenceReference: { type: String, trim: true },
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: false }
);

const inventoryControlSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: ['inventory'],
      default: 'inventory',
      required: true
    },
    status: {
      type: String,
      enum: ['Blocked', 'Enabled'],
      default: 'Blocked',
      required: true
    },
    reconciliationChecklist: {
      type: reconciliationChecklistSchema,
      default: () => ({})
    },
    enabledAt: Date,
    enabledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalEvidenceReference: { type: String, trim: true }
  },
  { timestamps: true }
);

inventoryControlSchema.pre('validate', function validateInventoryApproval(next) {
  if (this.status === 'Enabled') {
    const checklist = this.reconciliationChecklist;
    const requiredChecks = [
      'historicalBookingsReviewed',
      'supplierCommitmentsReviewed',
      'duplicateRecordsReviewed',
      'unresolvedAllocationsReviewed',
      'itemStockQuantitiesVerified',
      'outstandingReturnsReviewed'
    ];
    if (
      !checklist
      || requiredChecks.some((field) => checklist[field] !== true)
      || !checklist.evidenceReference?.trim()
      || !checklist.reviewedAt
      || !checklist.reviewedBy
      || !this.enabledAt
      || !this.enabledBy
      || !this.approvalEvidenceReference?.trim()
      || checklist.reviewedBy.toString() !== this.enabledBy.toString()
      || checklist.evidenceReference.trim() !== this.approvalEvidenceReference.trim()
    ) {
      this.invalidate(
        'status',
        'Enabling inventory requires a complete reconciliation checklist, matching evidence references, and approver audit details.'
      );
    }
  }
  next();
});

inventoryControlSchema.index({ key: 1 }, { unique: true });

const InventoryControl = mongoose.model('InventoryControl', inventoryControlSchema);
module.exports = InventoryControl;
