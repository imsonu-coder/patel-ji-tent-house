const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Item = require('../models/Item');
const Quotation = require('../models/Quotation');
const Booking = require('../models/Booking');
const SupplierArrangement = require('../models/SupplierArrangement');
const InventoryReservation = require('../models/InventoryReservation');
const InventoryReturnInspection = require('../models/InventoryReturnInspection');
const InventoryControl = require('../models/InventoryControl');

const ids = {
  user: new mongoose.Types.ObjectId(),
  item: new mongoose.Types.ObjectId(),
  booking: new mongoose.Types.ObjectId(),
  request: new mongoose.Types.ObjectId(),
  supplier: new mongoose.Types.ObjectId(),
  arrangement: new mongoose.Types.ObjectId(),
  reservation: new mongoose.Types.ObjectId()
};

const isValid = async (document) => {
  try {
    await document.validate();
    return true;
  } catch (error) {
    return false;
  }
};

const createValidReservation = (overrides = {}) => new InventoryReservation({
  booking: ids.booking,
  item: ids.item,
  quantity: 2,
  eventDates: {
    start: new Date('2026-10-29T00:00:00.000Z'),
    end: new Date('2026-10-31T00:00:00.000Z')
  },
  source: 'Owned',
  createdBy: ids.user,
  provenance: 'NewWorkflow',
  verificationStatus: 'Verified',
  verifiedAt: new Date('2026-10-28T12:00:00.000Z'),
  verifiedBy: ids.user,
  ...overrides
});

test('model validation checks complete without opening a database connection', () => {
  assert.equal(mongoose.connection.readyState, 0);
});

test('item inventory version and owned stock require non-negative integers', async () => {
  const valid = new Item({
    name: 'Test item',
    category: ids.item,
    description: 'Schema test item',
    basePrice: 1,
    ownStock: 4,
    inventoryVersion: 2
  });
  const invalid = new Item({
    name: 'Test item',
    category: ids.item,
    description: 'Schema test item',
    basePrice: 1,
    ownStock: 1.5,
    inventoryVersion: -1
  });

  assert.equal(await isValid(valid), true);
  assert.equal(await isValid(invalid), false);
});

test('quotation and booking item references remain optional for legacy line items', async () => {
  const quotation = new Quotation({
    request: ids.request,
    customer: ids.user,
    items: [{ itemName: 'Legacy item', quantity: 1, unitPrice: 10, subtotal: 10 }],
    finalTotal: 10
  });
  const booking = new Booking({
    bookingId: 'PJTHB-9010',
    customer: ids.user,
    request: ids.request,
    items: [{ itemName: 'Legacy item', quantity: 1 }]
  });

  assert.equal(await isValid(quotation), true);
  assert.equal(await isValid(booking), true);
  assert.equal(booking.inventoryVerificationStatus, undefined);
});

test('supplier arrangements preserve legacy status while validating new supply fields', async () => {
  const legacy = new SupplierArrangement({
    request: ids.request,
    supplier: ids.supplier,
    itemName: 'Legacy item',
    quantity: 2,
    status: 'Confirmed'
  });
  const invalid = new SupplierArrangement({
    request: ids.request,
    supplier: ids.supplier,
    item: ids.item,
    itemName: 'Chair',
    quantity: 2,
    confirmedQuantity: 3,
    supplyStatus: 'SupplierConfirmed',
    eventDates: {
      start: new Date('2026-10-31T00:00:00.000Z'),
      end: new Date('2026-10-29T00:00:00.000Z')
    }
  });

  assert.equal(await isValid(legacy), true);
  assert.equal(legacy.supplyStatus, undefined);
  assert.equal(legacy.commitmentVerificationStatus, undefined);
  assert.equal(await isValid(invalid), false);
});

test('verified supplier commitments require stable identity and exact line context', async () => {
  const verified = new SupplierArrangement({
    request: ids.request,
    supplier: ids.supplier,
    item: ids.item,
    itemName: 'Chair',
    quantity: 5,
    confirmedQuantity: 4,
    eventDates: {
      start: new Date('2026-10-29T00:00:00.000Z'),
      end: new Date('2026-10-31T00:00:00.000Z')
    },
    supplierCommitmentReference: 'PO-2026-14',
    supplierCommitmentLineIdentity: 'LINE-3',
    commitmentVerifiedAt: new Date(),
    commitmentVerifiedBy: ids.user,
    commitmentVerificationEvidenceReference: 'review://commitment/14-3',
    commitmentVerificationStatus: 'Verified'
  });
  const missingLineIdentity = new SupplierArrangement({
    request: ids.request,
    supplier: ids.supplier,
    item: ids.item,
    itemName: 'Chair',
    quantity: 5,
    eventDates: {
      start: new Date('2026-10-29T00:00:00.000Z'),
      end: new Date('2026-10-31T00:00:00.000Z')
    },
    supplierCommitmentReference: 'PO-2026-14',
    supplierCommitmentLineIdentity: 'LINE-3',
    commitmentVerificationStatus: 'Verified'
  });
  const identityIndex = SupplierArrangement.schema.indexes().find(
    ([fields]) => fields.supplierCommitmentReference === 1
  );

  assert.equal(await isValid(verified), true);
  assert.equal(await isValid(missingLineIdentity), false);
  assert.equal(identityIndex[1].unique, true);
  assert.equal(identityIndex[1].partialFilterExpression.commitmentVerificationStatus, 'Verified');
  assert.equal(identityIndex[1].partialFilterExpression.supplierCommitmentLineIdentity.$type, 'string');
});

test('supplier verification audit fields are required and legacy status stays unverified by default', async () => {
  const missingEvidence = new SupplierArrangement({
    request: ids.request,
    supplier: ids.supplier,
    item: ids.item,
    itemName: 'Chair',
    quantity: 2,
    eventDates: {
      start: new Date('2026-10-29T00:00:00.000Z'),
      end: new Date('2026-10-29T00:00:00.000Z')
    },
    supplierCommitmentReference: 'PO-2026-15',
    supplierCommitmentLineIdentity: 'LINE-1',
    commitmentVerifiedAt: new Date(),
    commitmentVerifiedBy: ids.user,
    commitmentVerificationStatus: 'Verified'
  });
  const invalidUnverifiedWithAudit = new SupplierArrangement({
    request: ids.request,
    supplier: ids.supplier,
    itemName: 'Legacy item',
    quantity: 1,
    commitmentVerificationStatus: 'UnverifiedLegacy',
    commitmentVerifiedAt: new Date(),
    commitmentVerifiedBy: ids.user
  });

  assert.equal(await isValid(missingEvidence), false);
  assert.equal(await isValid(invalidUnverifiedWithAudit), false);
});

test('supplier cancellation resolution requires administrator audit and reason', async () => {
  const unresolved = new SupplierArrangement({
    request: ids.request,
    supplier: ids.supplier,
    itemName: 'Chair',
    quantity: 2,
    cancellationReviewStatus: 'AdminResolved'
  });
  const resolved = new SupplierArrangement({
    request: ids.request,
    supplier: ids.supplier,
    itemName: 'Chair',
    quantity: 2,
    cancellationReviewStatus: 'AdminResolved',
    cancellationResolvedAt: new Date(),
    cancellationResolvedBy: ids.user,
    cancellationResolutionReason: 'Supplier unable to provide; reviewed by admin'
  });

  assert.equal(await isValid(unresolved), false);
  assert.equal(await isValid(resolved), true);
});

test('reservations validate quantities, date order, source links, and audit provenance', async () => {
  assert.equal(await isValid(createValidReservation()), true);
  assert.equal(await isValid(createValidReservation({ quantity: 1.5 })), false);
  assert.equal(await isValid(createValidReservation({
    eventDates: {
      start: new Date('2026-10-31T00:00:00.000Z'),
      end: new Date('2026-10-29T00:00:00.000Z')
    }
  })), false);
  assert.equal(await isValid(createValidReservation({ source: 'Supplier' })), false);
  assert.equal(await isValid(createValidReservation({
    provenance: 'LegacyUnverified',
    verificationStatus: 'LegacyUnverified',
    verifiedAt: undefined,
    verifiedBy: undefined
  })), true);
  assert.equal(await isValid(createValidReservation({
    provenance: 'NewWorkflow',
    verificationStatus: 'LegacyUnverified'
  })), false);
  const legacy = new InventoryReservation({
    booking: ids.booking,
    item: ids.item,
    quantity: 1,
    eventDates: {
      start: new Date('2026-10-29T00:00:00.000Z'),
      end: new Date('2026-10-29T00:00:00.000Z')
    },
    source: 'Owned',
    createdBy: ids.user
  });
  assert.equal(legacy.provenance, 'LegacyUnverified');
  assert.equal(legacy.verificationStatus, 'LegacyUnverified');
  assert.equal(await isValid(legacy), true);
});

test('manual reconciliation requires evidence and verified audit fields', async () => {
  const missingEvidence = createValidReservation({
    provenance: 'ManualReconciliation',
    verificationStatus: 'Verified'
  });
  const withEvidence = createValidReservation({
    provenance: 'ManualReconciliation',
    verificationStatus: 'Verified',
    verificationEvidenceReference: 'review://booking/reconciled'
  });

  assert.equal(await isValid(missingEvidence), false);
  assert.equal(await isValid(withEvidence), true);
});

test('reservation idempotency identity and cumulative released quantity are validated', async () => {
  const valid = createValidReservation({
    allocationIdempotencyKey: 'booking-item-owned-1'
  });
  const excessiveRelease = createValidReservation({ releasedQuantity: 3 });
  const positivePartialReleaseWithoutMetadata = createValidReservation({ releasedQuantity: 1 });
  const negativeRelease = createValidReservation({ releasedQuantity: -1 });
  const fractionalRelease = createValidReservation({ releasedQuantity: 0.5 });
  const blankKey = createValidReservation({ allocationIdempotencyKey: '   ' });
  const idempotencyIndex = InventoryReservation.schema.indexes().find(
    ([fields]) => fields.allocationIdempotencyKey === 1
  );

  assert.equal(await isValid(valid), true);
  assert.equal(await isValid(excessiveRelease), false);
  assert.equal(await isValid(positivePartialReleaseWithoutMetadata), false);
  assert.equal(await isValid(negativeRelease), false);
  assert.equal(await isValid(fractionalRelease), false);
  assert.equal(await isValid(blankKey), false);
  assert.equal(idempotencyIndex[1].unique, true);
  assert.equal(idempotencyIndex[1].partialFilterExpression.allocationIdempotencyKey.$type, 'string');
});

test('legacy reservations without release claims remain valid, but new and hydrated release claims require audit fields', async () => {
  const legacyFields = {
    booking: ids.booking,
    item: ids.item,
    quantity: 2,
    eventDates: {
      start: new Date('2026-10-29T00:00:00.000Z'),
      end: new Date('2026-10-31T00:00:00.000Z')
    },
    source: 'Owned',
    createdBy: ids.user,
    provenance: 'LegacyUnverified',
    verificationStatus: 'LegacyUnverified'
  };
  const legacyReserved = new InventoryReservation({
    ...legacyFields,
    status: 'Reserved'
  });
  const newlyCreatedLegacyRelease = new InventoryReservation({
    ...legacyFields,
    status: 'Released'
  });
  const fabricatedHydratedLegacyRelease = InventoryReservation.hydrate({
    ...legacyFields,
    _id: new mongoose.Types.ObjectId(),
    status: 'Released'
  });

  assert.equal(await isValid(legacyReserved), true);
  assert.equal(await isValid(newlyCreatedLegacyRelease), false);
  assert.equal(await isValid(fabricatedHydratedLegacyRelease), false);
});

test('new unsaved reservations validate non-dispatch structure without claiming persisted identity matching', async () => {
  const valid = createValidReservation({
    quantity: 1,
    status: 'Released',
    releasedAt: new Date(),
    releasedBy: ids.user,
    releasedQuantity: 1,
    releaseType: 'PreDispatchCancellation',
    releaseReason: 'Confirmed equipment was never sent'
  });
  valid.preDispatchVerification = {
    confirmedNeverDispatched: true,
    booking: ids.booking,
    reservation: new mongoose.Types.ObjectId(),
    quantity: 1,
    reason: 'Dispatch log and warehouse check completed',
    verifiedAt: new Date(),
    verifiedBy: ids.user
  };
  const mismatchedReservation = createValidReservation({
    quantity: 1,
    status: 'Released',
    releasedAt: new Date(),
    releasedBy: ids.user,
    releasedQuantity: 1,
    releaseType: 'PreDispatchCancellation',
    releaseReason: 'Never dispatched'
  });
  mismatchedReservation.preDispatchVerification = {
    confirmedNeverDispatched: true,
    booking: ids.booking,
    reservation: new mongoose.Types.ObjectId(),
    quantity: 1,
    reason: 'Dispatch log checked',
    verifiedAt: new Date(),
    verifiedBy: ids.user
  };

  assert.equal(await isValid(valid), true);
  assert.equal(await isValid(mismatchedReservation), true);
});

test('pre-dispatch verification rejects incomplete, contradictory, or excessive release details', async () => {
  const base = {
    quantity: 1,
    status: 'Released',
    releasedAt: new Date(),
    releasedBy: ids.user,
    releasedQuantity: 1,
    releaseType: 'PreDispatchCancellation',
    releaseReason: 'Confirmed equipment was never sent',
    preDispatchVerification: {
      confirmedNeverDispatched: true,
      booking: ids.booking,
      reservation: ids.reservation,
      quantity: 1,
      reason: 'Dispatch log and warehouse check completed',
      verifiedAt: new Date(),
      verifiedBy: ids.user
    }
  };
  const invalidCases = [
    { ...base, preDispatchVerification: { ...base.preDispatchVerification, confirmedNeverDispatched: false } },
    { ...base, preDispatchVerification: { ...base.preDispatchVerification, booking: new mongoose.Types.ObjectId() } },
    { ...base, preDispatchVerification: { ...base.preDispatchVerification, quantity: 3 } },
    { ...base, preDispatchVerification: { ...base.preDispatchVerification, reason: '   ' } },
    { ...base, preDispatchVerification: { ...base.preDispatchVerification, verifiedAt: undefined } },
    { ...base, preDispatchVerification: { ...base.preDispatchVerification, verifiedBy: undefined } },
    { ...base, releasedQuantity: 2 },
    { ...base, preDispatchVerification: undefined }
  ];

  for (const invalidData of invalidCases) {
    const invalid = createValidReservation({
      quantity: 1,
      ...invalidData,
      releaseReason: 'Confirmed equipment was never sent'
    });
    assert.equal(await isValid(invalid), false);
  }
});

test('owned reservation release requires passed inspection and admin audit', async () => {
  const missingInspection = createValidReservation({
    status: 'Released',
    releasedAt: new Date(),
    releasedBy: ids.user,
    releaseReason: 'Return processed'
  });
  const validReleased = createValidReservation({
    status: 'Released',
    releasedAt: new Date(),
    releasedBy: ids.user,
    releasedQuantity: 2,
    releaseType: 'ReturnInspection',
    releaseInspection: ids.reservation,
    releaseReason: 'Passed return inspection'
  });

  assert.equal(await isValid(missingInspection), false);
  assert.equal(await isValid(validReleased), true);
});

test('reservation release status and release type combinations must be structurally consistent', async () => {
  const validPreDispatch = createValidReservation({
    quantity: 1,
    status: 'Released',
    releasedAt: new Date(),
    releasedBy: ids.user,
    releasedQuantity: 1,
    releaseType: 'PreDispatchCancellation',
    releaseReason: 'Verified never dispatched',
    preDispatchVerification: {
      confirmedNeverDispatched: true,
      booking: ids.booking,
      reservation: ids.reservation,
      quantity: 1,
      reason: 'Dispatch records reviewed',
      verifiedAt: new Date(),
      verifiedBy: ids.user
    }
  });
  const releasedWithoutType = createValidReservation({
    status: 'Released',
    releasedAt: new Date(),
    releasedBy: ids.user,
    releasedQuantity: 2,
    releaseReason: 'No release type'
  });
  const reservedWithReleaseFields = createValidReservation({
    releaseType: 'ReturnInspection',
    releaseInspection: ids.reservation
  });
  const reservedWithOnlyReleaseReason = createValidReservation({
    releaseReason: 'Unverified release claim'
  });
  const reservedWithZeroReleaseQuantity = createValidReservation({
    releasedQuantity: 0
  });
  const legacyReleased = createValidReservation({
    status: 'Released',
    provenance: 'LegacyUnverified',
    verificationStatus: 'LegacyUnverified',
    releasedAt: new Date(),
    releasedBy: ids.user,
    releasedQuantity: 2,
    releaseType: 'ReturnInspection',
    releaseInspection: ids.reservation,
    releaseReason: 'Legacy release'
  });
  const persistedLegacyReleased = InventoryReservation.hydrate({
    _id: new mongoose.Types.ObjectId(),
    booking: ids.booking,
    item: ids.item,
    quantity: 2,
    eventDates: {
      start: new Date('2026-10-29T00:00:00.000Z'),
      end: new Date('2026-10-31T00:00:00.000Z')
    },
    source: 'Owned',
    status: 'Released',
    createdBy: ids.user,
    releasedAt: new Date(),
    releasedBy: ids.user,
    provenance: 'LegacyUnverified',
    verificationStatus: 'LegacyUnverified'
  });
  const fullReleaseAuditMissingQuantity = createValidReservation({
    status: 'Released',
    releasedAt: new Date(),
    releasedBy: ids.user,
    releaseType: 'ReturnInspection',
    releaseInspection: ids.reservation,
    releaseReason: 'Full release, missing quantity'
  });
  const fullReleaseQuantityMissingAudit = createValidReservation({
    status: 'Released',
    releasedQuantity: 2,
    releaseType: 'ReturnInspection',
    releaseInspection: ids.reservation,
    releaseReason: 'Full release, missing actor and time'
  });
  const conflictingReleaseMethods = createValidReservation({
    status: 'Released',
    releasedAt: new Date(),
    releasedBy: ids.user,
    releasedQuantity: 1,
    releaseType: 'PreDispatchCancellation',
    releaseInspection: ids.reservation,
    releaseReason: 'Conflicting release methods',
    preDispatchVerification: {
      confirmedNeverDispatched: true,
      booking: ids.booking,
      reservation: ids.reservation,
      quantity: 1,
      reason: 'Dispatch records reviewed',
      verifiedAt: new Date(),
      verifiedBy: ids.user
    }
  });

  assert.equal(await isValid(validPreDispatch), true);
  assert.equal(await isValid(releasedWithoutType), false);
  assert.equal(await isValid(reservedWithReleaseFields), false);
  assert.equal(await isValid(reservedWithOnlyReleaseReason), false);
  assert.equal(await isValid(reservedWithZeroReleaseQuantity), false);
  assert.equal(await isValid(legacyReleased), false);
  assert.equal(await isValid(persistedLegacyReleased), false);
  assert.equal(await isValid(fullReleaseAuditMissingQuantity), false);
  assert.equal(await isValid(fullReleaseQuantityMissingAudit), false);
  assert.equal(await isValid(conflictingReleaseMethods), false);
});

test('return inspection only releases a passed, physically returned quantity', async () => {
  const base = {
    booking: ids.booking,
    reservation: ids.reservation,
    item: ids.item,
    returnedQuantity: 3,
    inspectionOutcome: 'Passed',
    inspectedBy: ids.user,
    inspectedAt: new Date()
  };
  const valid = new InventoryReturnInspection({
    ...base,
    releaseStatus: 'Released',
    releasedQuantity: 2,
    releaseIdempotencyKey: 'return-release-valid',
    releasedAt: new Date(),
    releasedBy: ids.user
  });
  const failedInspection = new InventoryReturnInspection({
    ...base,
    inspectionOutcome: 'Damaged',
    releaseStatus: 'Released',
    releasedQuantity: 1,
    releaseIdempotencyKey: 'return-release-damaged',
    releasedAt: new Date(),
    releasedBy: ids.user
  });
  const excessRelease = new InventoryReturnInspection({
    ...base,
    releaseStatus: 'Released',
    releasedQuantity: 4,
    releaseIdempotencyKey: 'return-release-excess',
    releasedAt: new Date(),
    releasedBy: ids.user
  });

  assert.equal(await isValid(valid), true);
  assert.equal(await isValid(failedInspection), false);
  assert.equal(await isValid(excessRelease), false);
});

test('return release idempotency keys are validated and uniquely scoped to a reservation', async () => {
  const inspection = new InventoryReturnInspection({
    booking: ids.booking,
    reservation: ids.reservation,
    item: ids.item,
    returnedQuantity: 2,
    inspectionOutcome: 'Passed',
    inspectedBy: ids.user,
    inspectedAt: new Date(),
    releaseStatus: 'Released',
    releasedQuantity: 1,
    releaseIdempotencyKey: 'return-release-1',
    releasedAt: new Date(),
    releasedBy: ids.user
  });
  const blankKey = new InventoryReturnInspection({
    booking: ids.booking,
    reservation: ids.reservation,
    item: ids.item,
    returnedQuantity: 2,
    inspectionOutcome: 'Passed',
    inspectedBy: ids.user,
    inspectedAt: new Date(),
    releaseIdempotencyKey: ' '
  });
  const missingKey = new InventoryReturnInspection({
    booking: ids.booking,
    reservation: ids.reservation,
    item: ids.item,
    returnedQuantity: 2,
    inspectionOutcome: 'Passed',
    inspectedBy: ids.user,
    inspectedAt: new Date(),
    releaseStatus: 'Released',
    releasedQuantity: 1,
    releasedAt: new Date(),
    releasedBy: ids.user
  });
  const pendingWithReleaseKey = new InventoryReturnInspection({
    booking: ids.booking,
    reservation: ids.reservation,
    item: ids.item,
    returnedQuantity: 2,
    inspectionOutcome: 'Passed',
    inspectedBy: ids.user,
    inspectedAt: new Date(),
    releaseIdempotencyKey: 'unexpected-pending-key'
  });
  const idempotencyIndex = InventoryReturnInspection.schema.indexes().find(
    ([fields]) => fields.releaseIdempotencyKey === 1
  );

  assert.equal(await isValid(inspection), true);
  assert.equal(await isValid(blankKey), false);
  assert.equal(await isValid(missingKey), false);
  assert.equal(await isValid(pendingWithReleaseKey), false);
  assert.equal(idempotencyIndex[1].unique, true);
  assert.equal(idempotencyIndex[0].reservation, 1);
});

test('inventory control defaults blocked and requires complete audited reconciliation to enable', async () => {
  const blocked = new InventoryControl();
  const incomplete = new InventoryControl({
    status: 'Enabled',
    enabledAt: new Date(),
    enabledBy: ids.user,
    approvalEvidenceReference: 'audit://inventory-review-1',
    reconciliationChecklist: {
      historicalBookingsReviewed: true,
      supplierCommitmentsReviewed: true,
      duplicateRecordsReviewed: true,
      unresolvedAllocationsReviewed: false,
      itemStockQuantitiesVerified: true,
      outstandingReturnsReviewed: true,
      evidenceReference: 'audit://inventory-review-1',
      reviewedAt: new Date(),
      reviewedBy: ids.user
    }
  });
  const approved = new InventoryControl({
    status: 'Enabled',
    enabledAt: new Date(),
    enabledBy: ids.user,
    approvalEvidenceReference: 'audit://inventory-review-2',
    reconciliationChecklist: {
      historicalBookingsReviewed: true,
      supplierCommitmentsReviewed: true,
      duplicateRecordsReviewed: true,
      unresolvedAllocationsReviewed: true,
      itemStockQuantitiesVerified: true,
      outstandingReturnsReviewed: true,
      evidenceReference: 'audit://inventory-review-2',
      reviewedAt: new Date(),
      reviewedBy: ids.user
    }
  });
  const controlIndex = InventoryControl.schema.indexes().find(
    ([fields]) => fields.key === 1
  );

  assert.equal(blocked.status, 'Blocked');
  assert.equal(await isValid(blocked), true);
  assert.equal(await isValid(incomplete), false);
  assert.equal(await isValid(approved), true);
  assert.equal(controlIndex[1].unique, true);
});
