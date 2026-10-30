const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateItemAvailability,
  calculatePeakConcurrentQuantity,
  hasCompleteCoverage,
  normalizeDateOnlyUTC,
  normalizeDateRange,
  rangesOverlapInclusive
} = require('../services/inventoryService');

const itemId = 'item-1';
const bookingId = 'booking-1';
const adminId = 'admin-1';

const reservation = (overrides = {}) => ({
  _id: 'reservation-1',
  booking: bookingId,
  item: itemId,
  quantity: 2,
  eventDates: { start: '2026-10-29', end: '2026-10-31' },
  source: 'Owned',
  status: 'Reserved',
  provenance: 'NewWorkflow',
  verificationStatus: 'Verified',
  verifiedAt: '2026-10-28T12:00:00.000Z',
  verifiedBy: adminId,
  ...overrides
});

const verifiedBooking = (overrides = {}) => ({
  _id: bookingId,
  inventoryVerificationStatus: 'Verified',
  ...overrides
});

const releasedInspection = (overrides = {}) => ({
  _id: 'inspection-1',
  booking: bookingId,
  reservation: 'reservation-1',
  item: itemId,
  returnedQuantity: 2,
  inspectionOutcome: 'Passed',
  releaseStatus: 'Released',
  releasedQuantity: 2,
  releasedAt: '2026-11-01T10:00:00.000Z',
  releasedBy: adminId,
  ...overrides
});

const supplierCommitment = (overrides = {}) => ({
  _id: 'arrangement-verified',
  supplier: 'supplier-1',
  item: itemId,
  eventDates: { start: '2026-10-29', end: '2026-10-31' },
  quantity: 8,
  confirmedQuantity: 5,
  supplierCommitmentReference: 'PO-2026-14',
  supplierCommitmentLineIdentity: 'LINE-1',
  commitmentVerificationStatus: 'Verified',
  commitmentVerifiedAt: '2026-10-28T09:00:00.000Z',
  commitmentVerifiedBy: adminId,
  commitmentVerificationEvidenceReference: 'review://commitment/14-1',
  supplyStatus: 'SupplierConfirmed',
  supplyConfirmedAt: '2026-10-28T10:00:00.000Z',
  supplyConfirmedBy: adminId,
  allocationStatus: 'Unreserved',
  status: 'Confirmed',
  ...overrides
});

test('normalizes dates to UTC calendar days and rejects invalid ranges', () => {
  assert.equal(normalizeDateOnlyUTC('2026-10-29').toISOString(), '2026-10-29T00:00:00.000Z');
  assert.equal(
    normalizeDateOnlyUTC('2026-10-29T23:30:00-05:00').toISOString(),
    '2026-10-30T00:00:00.000Z'
  );
  assert.throws(() => normalizeDateOnlyUTC('2026-02-30'), RangeError);
  assert.throws(() => normalizeDateRange('2026-10-31', '2026-10-29'), RangeError);
});

test('inclusive overlap includes same-day and shared boundaries but not adjacent dates', () => {
  assert.equal(
    rangesOverlapInclusive(
      { start: '2026-10-29', end: '2026-10-29' },
      { start: '2026-10-29', end: '2026-10-29' }
    ),
    true
  );
  assert.equal(
    rangesOverlapInclusive(
      { start: '2026-10-29', end: '2026-10-30' },
      { start: '2026-10-30', end: '2026-10-31' }
    ),
    true
  );
  assert.equal(
    rangesOverlapInclusive(
      { start: '2026-10-29', end: '2026-10-30' },
      { start: '2026-10-31', end: '2026-11-01' }
    ),
    false
  );
});

test('calculates peak concurrent quantity across multi-day date ranges', () => {
  const peak = calculatePeakConcurrentQuantity([
    { _id: 'a', quantity: 3, eventDates: { start: '2026-10-29', end: '2026-10-31' } },
    { _id: 'b', quantity: 4, eventDates: { start: '2026-10-31', end: '2026-11-02' } },
    { _id: 'c', quantity: 8, eventDates: { start: '2026-11-03', end: '2026-11-04' } }
  ], { start: '2026-10-29', end: '2026-11-02' });

  assert.equal(peak, 7);
});

test('deduplicates repeated reservation records and rejects conflicting duplicate ids', () => {
  const record = { _id: 'same', quantity: 2, eventDates: { start: '2026-10-29', end: '2026-10-29' } };
  assert.equal(
    calculatePeakConcurrentQuantity([record, { ...record, eventDates: { ...record.eventDates } }], {
      start: '2026-10-29',
      end: '2026-10-29'
    }),
    2
  );
  assert.throws(
    () => calculatePeakConcurrentQuantity([record, { ...record, quantity: 3 }], {
      start: '2026-10-29',
      end: '2026-10-29'
    }),
    /conflicting records/
  );
});

test('complete coverage rejects insufficient quantities and counts distinct duplicate item lines', () => {
  assert.equal(
    hasCompleteCoverage(
      [{ _id: 'line-a', item: itemId, quantity: 2 }, { _id: 'line-b', item: itemId, quantity: 3 }],
      { [itemId]: 5 }
    ),
    true
  );
  assert.equal(
    hasCompleteCoverage(
      [{ _id: 'line-a', item: itemId, quantity: 2 }, { _id: 'line-b', item: itemId, quantity: 3 }],
      { [itemId]: 4 }
    ),
    false
  );
});

test('legacy and unverified bookings or reservations do not consume verified availability', () => {
  const availability = calculateItemAvailability({
    itemId,
    ownStock: 5,
    range: { start: '2026-10-29', end: '2026-10-31' },
    reservations: [
      reservation(),
      reservation({
        _id: 'legacy-reservation',
        booking: 'legacy-booking',
        provenance: 'LegacyUnverified',
        verificationStatus: 'LegacyUnverified'
      })
    ],
    bookings: [verifiedBooking(), { _id: 'legacy-booking' }]
  });

  assert.equal(availability.ownedPeakConcurrentQuantity, 2);
  assert.equal(availability.ownedAvailableQuantity, 3);
});

test('supplier commitments count once and active allocations reduce rather than add supply', () => {
  const arrangement = supplierCommitment({
    _id: 'arrangement-1',
    allocationStatus: 'Reserved'
  });
  const supplierAllocation = reservation({
    _id: 'supplier-reservation',
    source: 'Supplier',
    supplierArrangement: 'arrangement-1',
    quantity: 2
  });
  const options = {
    itemId,
    ownStock: 0,
    range: { start: '2026-10-29', end: '2026-10-31' },
    supplierArrangements: [arrangement, { ...arrangement }],
    reservations: [supplierAllocation, { ...supplierAllocation }],
    bookings: [verifiedBooking()]
  };

  assert.equal(calculateItemAvailability(options).supplierAvailableQuantity, 3);
  assert.equal(calculateItemAvailability(options).supplierReservedQuantity, 2);
  assert.equal(calculateItemAvailability(options).availableQuantity, 3);
});

test('multiple distinct allocations reduce one supplier commitment by their total quantity', () => {
  const arrangement = supplierCommitment({
    _id: 'arrangement-multi',
    confirmedQuantity: 8,
    allocationStatus: 'Reserved'
  });
  const allocations = [
    reservation({
      _id: 'supplier-reservation-a',
      booking: 'booking-a',
      source: 'Supplier',
      supplierArrangement: arrangement._id,
      quantity: 2
    }),
    reservation({
      _id: 'supplier-reservation-b',
      booking: 'booking-b',
      source: 'Supplier',
      supplierArrangement: arrangement._id,
      quantity: 3
    })
  ];

  const availability = calculateItemAvailability({
    itemId,
    ownStock: 0,
    range: { start: '2026-10-29', end: '2026-10-31' },
    supplierArrangements: [arrangement],
    reservations: allocations,
    bookings: [
      verifiedBooking({ _id: 'booking-a' }),
      verifiedBooking({ _id: 'booking-b' })
    ]
  });

  assert.equal(availability.supplierAvailableQuantity, 3);
});

test('duplicate supplier commitment identities never inflate usable capacity', () => {
  const commitment = supplierCommitment();
  const availability = calculateItemAvailability({
    itemId,
    ownStock: 0,
    range: { start: '2026-10-29', end: '2026-10-31' },
    supplierArrangements: [
      { ...commitment, _id: 'arrangement-copy-a' },
      { ...commitment, _id: 'arrangement-copy-b' }
    ],
    reservations: [],
    bookings: []
  });

  // Distinct IDs cannot be proven to represent the same external commitment.
  assert.equal(availability.supplierAvailableQuantity, 0);
});

test('supplier commitments with overlapping but non-identical dates are excluded', () => {
  const availability = calculateItemAvailability({
    itemId,
    ownStock: 0,
    range: { start: '2026-10-29', end: '2026-10-31' },
    supplierArrangements: [supplierCommitment({
      _id: 'arrangement-overlap',
      eventDates: { start: '2026-10-30', end: '2026-11-01' },
      confirmedQuantity: 7
    })],
    reservations: [],
    bookings: []
  });

  assert.equal(availability.supplierAvailableQuantity, 0);
});

test('legacy supplier status and unverified supplier allocations are excluded', () => {
  const legacyArrangement = {
    _id: 'legacy-arrangement',
    item: itemId,
    eventDates: { start: '2026-10-29', end: '2026-10-31' },
    quantity: 10,
    status: 'Confirmed'
  };
  const availability = calculateItemAvailability({
    itemId,
    ownStock: 0,
    range: { start: '2026-10-29', end: '2026-10-31' },
    supplierArrangements: [legacyArrangement],
    reservations: [],
    bookings: []
  });

  assert.equal(availability.supplierAvailableQuantity, 0);
});

test('only fully verified supplier commitments contribute usable capacity', () => {
  const verified = supplierCommitment({ _id: 'verified-supplier-line' });
  const unavailableArrangements = [
    supplierCommitment({
      _id: 'missing-verification-status',
      commitmentVerificationStatus: undefined
    }),
    supplierCommitment({
      _id: 'unverified-commitment',
      commitmentVerificationStatus: 'UnverifiedLegacy'
    }),
    supplierCommitment({
      _id: 'pending-supply',
      supplyStatus: 'Pending'
    }),
    supplierCommitment({
      _id: 'missing-verification-audit',
      commitmentVerifiedAt: undefined
    }),
    supplierCommitment({
      _id: 'missing-confirmation-audit',
      supplyConfirmedBy: undefined
    }),
    supplierCommitment({
      _id: 'invalid-confirmation-timestamp',
      supplyConfirmedAt: 'not-a-timestamp'
    }),
    supplierCommitment({
      _id: 'confirmed-quantity-exceeds-requested',
      quantity: 4,
      confirmedQuantity: 5
    })
  ];
  const availability = (supplierArrangements) => calculateItemAvailability({
    itemId,
    ownStock: 0,
    range: { start: '2026-10-29', end: '2026-10-31' },
    supplierArrangements,
    reservations: [],
    bookings: []
  }).supplierAvailableQuantity;

  assert.equal(availability([verified]), 5);
  for (const arrangement of unavailableArrangements) {
    assert.equal(availability([arrangement]), 0, arrangement._id);
  }
});

test('supplier capacity stays unavailable during cancellation review and requires valid admin resolution', () => {
  const availability = (arrangement) => calculateItemAvailability({
    itemId,
    ownStock: 0,
    range: { start: '2026-10-29', end: '2026-10-31' },
    supplierArrangements: [supplierCommitment(arrangement)],
    reservations: [],
    bookings: []
  }).supplierAvailableQuantity;

  assert.equal(availability({ cancellationReviewStatus: 'PendingReview' }), 0);
  assert.equal(availability({ cancellationReviewStatus: 'SupplierConfirmed' }), 0);
  assert.equal(availability({
    cancellationReviewStatus: 'AdminResolved',
    cancellationResolvedAt: '2026-10-28T11:00:00.000Z',
    cancellationResolvedBy: adminId,
    cancellationResolutionReason: 'Administrator reviewed and retained the commitment'
  }), 5);
  assert.equal(availability({
    cancellationReviewStatus: 'AdminResolved',
    cancellationResolvedAt: 'not-a-timestamp',
    cancellationResolvedBy: adminId,
    cancellationResolutionReason: 'Resolution audit is invalid'
  }), 0);
});

test('supplier arrangements marked allocated without a verified allocation fail closed', () => {
  const availability = calculateItemAvailability({
    itemId,
    ownStock: 0,
    range: { start: '2026-10-29', end: '2026-10-31' },
    supplierArrangements: [supplierCommitment({
      _id: 'arrangement-1',
      allocationStatus: 'Reserved'
    })],
    reservations: [],
    bookings: []
  });

  assert.equal(availability.supplierAvailableQuantity, 0);
});

test('availability reports over-allocation instead of making owned stock negative', () => {
  const availability = calculateItemAvailability({
    itemId,
    ownStock: 1,
    range: { start: '2026-10-29', end: '2026-10-31' },
    reservations: [reservation({ quantity: 2 })],
    bookings: [verifiedBooking()]
  });

  assert.equal(availability.ownedOverAllocatedQuantity, 1);
  assert.equal(availability.ownedAvailableQuantity, 0);
});

test('a return inspection alone does not release stock; only a caller-allow-listed passed release does', () => {
  const base = {
    itemId,
    ownStock: 4,
    range: { start: '2026-11-02', end: '2026-11-02' },
    reservations: [reservation()],
    bookings: [verifiedBooking()]
  };
  const notReleased = calculateItemAvailability({
    ...base,
    inspections: [{
      ...releasedInspection(),
      releaseStatus: 'NotReleased',
      releasedQuantity: 0,
      releasedAt: undefined,
      releasedBy: undefined
    }],
    authorizedAdminIds: [adminId]
  });
  const unauthorized = calculateItemAvailability({
    ...base,
    inspections: [releasedInspection({ releasedBy: 'not-an-admin' })],
    authorizedAdminIds: [adminId]
  });
  const callerAllowListed = calculateItemAvailability({
    ...base,
    inspections: [releasedInspection()],
    authorizedAdminIds: [adminId]
  });

  assert.equal(notReleased.ownedAvailableQuantity, 2);
  assert.equal(unauthorized.ownedAvailableQuantity, 2);
  assert.equal(callerAllowListed.ownedAvailableQuantity, 4);
});

test('failed, damaged, and needs-repair inspections never release owned stock', () => {
  for (const inspectionOutcome of ['Failed', 'Damaged', 'NeedsRepair']) {
    const availability = calculateItemAvailability({
      itemId,
      ownStock: 4,
      range: { start: '2026-11-02', end: '2026-11-02' },
      reservations: [reservation()],
      inspections: [releasedInspection({ inspectionOutcome })],
      bookings: [verifiedBooking()],
      authorizedAdminIds: [adminId]
    });

    assert.equal(availability.ownedAvailableQuantity, 2, inspectionOutcome);
  }
});

test('partial returns release only their recorded quantity and do not release on event end', () => {
  const partial = releasedInspection({
    _id: 'partial-inspection',
    returnedQuantity: 1,
    releasedQuantity: 1
  });
  const availability = calculateItemAvailability({
    itemId,
    ownStock: 4,
    range: { start: '2026-11-02', end: '2026-11-02' },
    reservations: [reservation()],
    inspections: [partial],
    bookings: [verifiedBooking()],
    authorizedAdminIds: [adminId]
  });
  const duringEvent = calculateItemAvailability({
    itemId,
    ownStock: 4,
    range: { start: '2026-10-31', end: '2026-10-31' },
    reservations: [reservation()],
    inspections: [partial],
    bookings: [verifiedBooking()],
    authorizedAdminIds: [adminId]
  });

  assert.equal(availability.ownedAvailableQuantity, 3);
  assert.equal(duringEvent.ownedAvailableQuantity, 2);
});

test('release on the event final day is effective the next UTC day', () => {
  const base = {
    itemId,
    ownStock: 4,
    reservations: [reservation()],
    bookings: [verifiedBooking()],
    authorizedAdminIds: [adminId]
  };
  const finalDayRelease = releasedInspection({
    releasedAt: '2026-10-31T23:59:59.000Z'
  });
  const eventFinalDay = calculateItemAvailability({
    ...base,
    range: { start: '2026-10-31', end: '2026-10-31' },
    inspections: [finalDayRelease]
  });
  const nextDay = calculateItemAvailability({
    ...base,
    range: { start: '2026-11-01', end: '2026-11-01' },
    inspections: [finalDayRelease]
  });

  assert.equal(eventFinalDay.ownedAvailableQuantity, 2);
  assert.equal(nextDay.ownedAvailableQuantity, 4);
});

test('release after the event end becomes effective the UTC day after its recorded release date', () => {
  const availability = calculateItemAvailability({
    itemId,
    ownStock: 4,
    range: { start: '2026-11-04', end: '2026-11-04' },
    reservations: [reservation()],
    inspections: [releasedInspection({ releasedAt: '2026-11-02T08:00:00.000Z' })],
    bookings: [verifiedBooking()],
    authorizedAdminIds: [adminId]
  });
  const beforeReleaseEffectiveDay = calculateItemAvailability({
    itemId,
    ownStock: 4,
    range: { start: '2026-11-02', end: '2026-11-02' },
    reservations: [reservation()],
    inspections: [releasedInspection({ releasedAt: '2026-11-02T08:00:00.000Z' })],
    bookings: [verifiedBooking()],
    authorizedAdminIds: [adminId]
  });

  assert.equal(beforeReleaseEffectiveDay.ownedAvailableQuantity, 2);
  assert.equal(availability.ownedAvailableQuantity, 4);
});

test('repeated release inputs are counted once and releases above reservation quantity fail closed', () => {
  const release = releasedInspection({
    _id: 'partial-inspection',
    returnedQuantity: 1,
    releasedQuantity: 1
  });
  const inputs = {
    itemId,
    ownStock: 4,
    range: { start: '2026-11-02', end: '2026-11-02' },
    reservations: [reservation()],
    bookings: [verifiedBooking()],
    authorizedAdminIds: [adminId]
  };
  assert.equal(
    calculateItemAvailability({ ...inputs, inspections: [release, { ...release }] }).ownedAvailableQuantity,
    3
  );
  assert.throws(
    () => calculateItemAvailability({
      ...inputs,
      inspections: [
        release,
        releasedInspection({
          _id: 'second-partial-inspection',
          returnedQuantity: 2,
          releasedQuantity: 2
        })
      ]
    }),
    /cannot exceed the reserved quantity/
  );
});

test('distinct inspection IDs for one repeated physical release expose the missing identity risk', () => {
  const repeatedPhysicalRelease = {
    ...releasedInspection({
      _id: 'inspection-physical-release-a',
      returnedQuantity: 1,
      releasedQuantity: 1
    }),
    notes: 'Same physical return logged a second time'
  };
  const duplicateRecord = {
    ...repeatedPhysicalRelease,
    _id: 'inspection-physical-release-b'
  };
  const availability = calculateItemAvailability({
    itemId,
    ownStock: 6,
    range: { start: '2026-11-02', end: '2026-11-02' },
    reservations: [reservation({ quantity: 5 })],
    inspections: [repeatedPhysicalRelease, duplicateRecord],
    bookings: [verifiedBooking()],
    authorizedAdminIds: [adminId]
  });

  // The helper sees two distinct IDs and cannot know these describe one physical release.
  assert.equal(availability.ownedAvailableQuantity, 3);
});
