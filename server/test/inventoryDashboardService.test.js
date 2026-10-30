const test = require('node:test');
const assert = require('node:assert/strict');
const { buildInventoryDashboard } = require('../services/inventoryDashboardService');

const itemId = 'item-1';
const bookingId = 'booking-1';
const adminId = 'admin-1';
const range = { start: '2026-10-29', end: '2026-10-31' };
const item = { _id: itemId, name: 'Banquet chair', ownStock: 6, status: 'active' };
const booking = {
  _id: bookingId,
  status: 'Confirmed',
  inventoryVerificationStatus: 'Verified',
  eventDates: { start: range.start, end: range.end },
  items: [{ item: itemId, quantity: 2 }]
};
const verifiedReservation = {
  _id: 'reservation-1',
  booking: bookingId,
  item: itemId,
  quantity: 2,
  eventDates: { start: range.start, end: range.end },
  source: 'Owned',
  status: 'Reserved',
  provenance: 'NewWorkflow',
  verificationStatus: 'Verified',
  verifiedAt: '2026-10-28T12:00:00.000Z',
  verifiedBy: adminId
};

const snapshot = (overrides = {}) => buildInventoryDashboard({
  items: [item],
  reservations: [],
  inspections: [],
  bookings: [],
  supplierArrangements: [],
  authorizedAdminIds: [adminId],
  range,
  ...overrides
});

test('verified owned reservations are shown separately from stock and availability', () => {
  const result = snapshot({
    reservations: [verifiedReservation],
    bookings: [booking]
  });

  assert.equal(result.items[0].ownStock, 6);
  assert.equal(result.items[0].ownedReservedQuantity, 2);
  assert.equal(result.items[0].ownedAvailableQuantity, 4);
  assert.equal(result.items[0].availabilityStatus, 'Verified');
});

test('legacy or unverified reservations do not get represented as available stock', () => {
  const result = snapshot({
    reservations: [{
      ...verifiedReservation,
      provenance: 'LegacyUnverified',
      verificationStatus: 'LegacyUnverified',
      verifiedAt: undefined,
      verifiedBy: undefined
    }],
    bookings: [{ ...booking, inventoryVerificationStatus: undefined }]
  });

  assert.equal(result.items[0].ownedReservedQuantity, 0);
  assert.equal(result.items[0].ownedAvailableQuantity, null);
  assert.equal(result.items[0].availableQuantity, null);
  assert.equal(result.items[0].availabilityStatus, 'Unverified');
});

test('confirmed legacy bookings without verified reservations make availability unverified', () => {
  const result = snapshot({
    bookings: [{ ...booking, inventoryVerificationStatus: undefined }]
  });

  assert.equal(result.items[0].ownedAvailableQuantity, null);
  assert.equal(result.items[0].availabilityStatus, 'Unverified');
});

test('booking availability remains unverified when only some requested units have reservations', () => {
  const result = snapshot({
    reservations: [verifiedReservation],
    bookings: [{
      ...booking,
      items: [
        { item: itemId, quantity: 2 },
        { item: itemId, quantity: 3 }
      ]
    }]
  });

  assert.equal(result.items[0].ownedAvailableQuantity, null);
  assert.equal(result.items[0].availabilityStatus, 'Unverified');
});

test('duplicate supplier commitment identities are labelled and excluded from capacity', () => {
  const commitment = {
    _id: 'commitment-a',
    supplier: 'supplier-1',
    item: itemId,
    itemName: 'Banquet chair',
    quantity: 5,
    confirmedQuantity: 4,
    eventDates: { start: range.start, end: range.end },
    supplierCommitmentReference: 'PO-1',
    supplierCommitmentLineIdentity: 'LINE-1',
    commitmentVerificationStatus: 'Verified',
    commitmentVerifiedAt: '2026-10-28T09:00:00.000Z',
    commitmentVerifiedBy: adminId,
    commitmentVerificationEvidenceReference: 'audit-1',
    supplyStatus: 'SupplierConfirmed',
    supplyConfirmedAt: '2026-10-28T10:00:00.000Z',
    supplyConfirmedBy: adminId,
    allocationStatus: 'Unreserved',
    status: 'Confirmed'
  };
  const result = snapshot({
    supplierArrangements: [
      commitment,
      { ...commitment, _id: 'commitment-b' }
    ]
  });

  assert.equal(result.items[0].supplierAvailableQuantity, 0);
  assert.match(result.supplierArrangements[0].inventoryAvailabilityNote, /Duplicate supplier commitment identity/);
});

test('invalid stock and over-allocation are visibly distinguished', () => {
  const invalidStock = snapshot({ items: [{ ...item, ownStock: -1 }] });
  const overAllocated = snapshot({
    items: [{ ...item, ownStock: 1 }],
    reservations: [verifiedReservation],
    bookings: [booking]
  });

  assert.equal(invalidStock.items[0].availabilityStatus, 'InvalidStock');
  assert.equal(invalidStock.items[0].availableQuantity, null);
  assert.equal(overAllocated.items[0].availabilityStatus, 'OverAllocated');
  assert.equal(overAllocated.items[0].ownedAvailableQuantity, 0);
});

test('reservations with missing date identity remain unverified instead of appearing available', () => {
  const result = snapshot({
    reservations: [{
      ...verifiedReservation,
      provenance: 'LegacyUnverified',
      verificationStatus: 'LegacyUnverified',
      verifiedAt: undefined,
      verifiedBy: undefined,
      eventDates: {}
    }]
  });

  assert.equal(result.items[0].ownedAvailableQuantity, null);
  assert.equal(result.items[0].availabilityStatus, 'Unverified');
});
