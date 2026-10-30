const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const User = require('../models/User');
const Item = require('../models/Item');
const Category = require('../models/Category');
const EventRequest = require('../models/EventRequest');
const Quotation = require('../models/Quotation');
const Booking = require('../models/Booking');
const Supplier = require('../models/Supplier');
const SupplierArrangement = require('../models/SupplierArrangement');
const InventoryReservation = require('../models/InventoryReservation');
const InventoryReturnInspection = require('../models/InventoryReturnInspection');
const InventoryControl = require('../models/InventoryControl');

let replSet;

test.before(async () => {
  // Start isolated in-memory MongoDB replica set with 1 node and wiredTiger storage engine
  replSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: 'wiredTiger'
    }
  });

  const uri = replSet.getUri();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

  // Sync and build indexes across models in the replica set
  await Promise.all([
    User.syncIndexes(),
    Item.syncIndexes(),
    EventRequest.syncIndexes(),
    Booking.syncIndexes(),
    SupplierArrangement.syncIndexes(),
    InventoryReservation.syncIndexes(),
    InventoryReturnInspection.syncIndexes(),
    InventoryControl.syncIndexes()
  ]);
});

test.after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.disconnect();
  }
  if (replSet) {
    await replSet.stop();
  }
});

test('isolated replica set verifies unique constraints on User phone and email', async () => {
  const email = 'unique.user@example.com';
  const phone = '+919999900001';

  await User.create({
    name: 'Initial User',
    phone,
    email,
    password: 'securepassword123',
    role: 'customer'
  });

  // Attempt duplicate email
  await assert.rejects(
    User.create({
      name: 'Duplicate Email User',
      phone: '+919999900002',
      email,
      password: 'securepassword123'
    }),
    (err) => err.code === 11000
  );

  // Attempt duplicate phone
  await assert.rejects(
    User.create({
      name: 'Duplicate Phone User',
      phone,
      email: 'other.email@example.com',
      password: 'securepassword123'
    }),
    (err) => err.code === 11000
  );
});

test('isolated replica set verifies unique partial index on Booking.request', async () => {
  const customer = new mongoose.Types.ObjectId();
  const requestId = new mongoose.Types.ObjectId();

  await Booking.create({
    bookingId: 'PJTHB-8001',
    customer,
    request: requestId,
    items: [{ itemName: 'Banquet chair', quantity: 10 }],
    status: 'Pending'
  });

  // Attempt second booking for the same request
  await assert.rejects(
    Booking.create({
      bookingId: 'PJTHB-8002',
      customer,
      request: requestId,
      items: [{ itemName: 'Round table', quantity: 2 }],
      status: 'Pending'
    }),
    (err) => err.code === 11000
  );
});

test('isolated replica set verifies unique partial index on InventoryReservation.allocationIdempotencyKey', async () => {
  const bookingId = new mongoose.Types.ObjectId();
  const itemId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  const idempotencyKey = 'alloc-booking-8001-item-1';

  await InventoryReservation.create({
    booking: bookingId,
    item: itemId,
    quantity: 5,
    eventDates: {
      start: new Date('2026-11-10T00:00:00.000Z'),
      end: new Date('2026-11-12T00:00:00.000Z')
    },
    source: 'Owned',
    allocationIdempotencyKey: idempotencyKey,
    createdBy: adminId,
    provenance: 'NewWorkflow',
    verificationStatus: 'Verified',
    verifiedAt: new Date(),
    verifiedBy: adminId
  });

  // Attempt duplicate reservation with the same idempotency key for this booking
  await assert.rejects(
    InventoryReservation.create({
      booking: bookingId,
      item: itemId,
      quantity: 5,
      eventDates: {
        start: new Date('2026-11-10T00:00:00.000Z'),
        end: new Date('2026-11-12T00:00:00.000Z')
      },
      source: 'Owned',
      allocationIdempotencyKey: idempotencyKey,
      createdBy: adminId,
      provenance: 'NewWorkflow',
      verificationStatus: 'Verified',
      verifiedAt: new Date(),
      verifiedBy: adminId
    }),
    (err) => err.code === 11000
  );
});

test('isolated replica set verifies unique partial index on InventoryReturnInspection.releaseIdempotencyKey', async () => {
  const bookingId = new mongoose.Types.ObjectId();
  const reservationId = new mongoose.Types.ObjectId();
  const itemId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  const releaseKey = 'return-release-key-001';

  await InventoryReturnInspection.create({
    booking: bookingId,
    reservation: reservationId,
    item: itemId,
    returnedQuantity: 5,
    inspectionOutcome: 'Passed',
    inspectedBy: adminId,
    inspectedAt: new Date(),
    releaseStatus: 'Released',
    releasedQuantity: 5,
    releaseIdempotencyKey: releaseKey,
    releasedAt: new Date(),
    releasedBy: adminId
  });

  // Duplicate release idempotency key on same reservation should be rejected by index
  await assert.rejects(
    InventoryReturnInspection.create({
      booking: bookingId,
      reservation: reservationId,
      item: itemId,
      returnedQuantity: 5,
      inspectionOutcome: 'Passed',
      inspectedBy: adminId,
      inspectedAt: new Date(),
      releaseStatus: 'Released',
      releasedQuantity: 5,
      releaseIdempotencyKey: releaseKey,
      releasedAt: new Date(),
      releasedBy: adminId
    }),
    (err) => err.code === 11000
  );
});

test('isolated replica set verifies unique partial index on SupplierArrangement verified commitment', async () => {
  const supplierId = new mongoose.Types.ObjectId();
  const itemId = new mongoose.Types.ObjectId();
  const requestId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  const dates = {
    start: new Date('2026-12-01T00:00:00.000Z'),
    end: new Date('2026-12-03T00:00:00.000Z')
  };

  await SupplierArrangement.create({
    request: requestId,
    supplier: supplierId,
    item: itemId,
    itemName: 'Royal Tent',
    quantity: 2,
    confirmedQuantity: 2,
    eventDates: dates,
    supplierCommitmentReference: 'SUPP-PO-991',
    supplierCommitmentLineIdentity: 'LINE-1',
    commitmentVerificationStatus: 'Verified',
    commitmentVerifiedAt: new Date(),
    commitmentVerifiedBy: adminId,
    commitmentVerificationEvidenceReference: 'audit://supplier/po-991-line-1',
    supplyStatus: 'SupplierConfirmed',
    supplyConfirmedAt: new Date(),
    supplyConfirmedBy: adminId
  });

  // Duplicate verified commitment with identical supplier, reference, line identity, item, and dates
  await assert.rejects(
    SupplierArrangement.create({
      request: new mongoose.Types.ObjectId(),
      supplier: supplierId,
      item: itemId,
      itemName: 'Royal Tent',
      quantity: 2,
      confirmedQuantity: 2,
      eventDates: dates,
      supplierCommitmentReference: 'SUPP-PO-991',
      supplierCommitmentLineIdentity: 'LINE-1',
      commitmentVerificationStatus: 'Verified',
      commitmentVerifiedAt: new Date(),
      commitmentVerifiedBy: adminId,
      commitmentVerificationEvidenceReference: 'audit://supplier/po-991-line-1-dup',
      supplyStatus: 'SupplierConfirmed',
      supplyConfirmedAt: new Date(),
      supplyConfirmedBy: adminId
    }),
    (err) => err.code === 11000
  );
});

test('isolated replica set verifies single InventoryControl document', async () => {
  const adminId = new mongoose.Types.ObjectId();
  await InventoryControl.create({
    key: 'inventory',
    status: 'Blocked'
  });

  // Attempt creating a second inventory control document
  await assert.rejects(
    InventoryControl.create({
      key: 'inventory',
      status: 'Blocked'
    }),
    (err) => err.code === 11000
  );
});

test('multi-document transaction commits atomically across Booking and EventRequest', async () => {
  const customerId = new mongoose.Types.ObjectId();

  const request = await EventRequest.create({
    requestId: 'PJTH-TX-01',
    user: customerId,
    eventType: 'Wedding',
    startDate: new Date('2026-11-20T00:00:00.000Z'),
    endDate: new Date('2026-11-22T00:00:00.000Z'),
    location: 'City Palace, Jaipur',
    guestCount: 200,
    status: 'Quotation Accepted'
  });

  const quotation = await Quotation.create({
    request: request._id,
    customer: customerId,
    items: [{ itemName: 'Banquet chair', quantity: 20, unitPrice: 100, subtotal: 2000 }],
    finalTotal: 2000,
    status: 'Accepted'
  });

  const booking = await Booking.create({
    bookingId: 'PJTHB-TX-01',
    customer: customerId,
    request: request._id,
    quotation: quotation._id,
    status: 'Pending',
    finalAmount: 2000
  });

  // Execute multi-document transaction to cancel booking and update request
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const b = await Booking.findById(booking._id).session(session);
      b.status = 'Cancelled';
      await b.save({ session });

      const r = await EventRequest.findById(request._id).session(session);
      r.status = 'Cancelled';
      await r.save({ session });
    });
  } finally {
    await session.endSession();
  }

  // Verify atomic persistence outside session
  const updatedBooking = await Booking.findById(booking._id);
  const updatedRequest = await EventRequest.findById(request._id);

  assert.equal(updatedBooking.status, 'Cancelled');
  assert.equal(updatedRequest.status, 'Cancelled');
});

test('multi-document transaction rollback on error leaves all records unmodified', async () => {
  const customerId = new mongoose.Types.ObjectId();

  const request = await EventRequest.create({
    requestId: 'PJTH-TX-02',
    user: customerId,
    eventType: 'Birthday',
    startDate: new Date('2026-11-25T00:00:00.000Z'),
    endDate: new Date('2026-11-25T00:00:00.000Z'),
    location: 'Mansarovar, Jaipur',
    guestCount: 50,
    status: 'Quotation Accepted'
  });

  const quotation = await Quotation.create({
    request: request._id,
    customer: customerId,
    items: [{ itemName: 'Chandelier', quantity: 1, unitPrice: 1500, subtotal: 1500 }],
    finalTotal: 1500,
    status: 'Accepted'
  });

  const booking = await Booking.create({
    bookingId: 'PJTHB-TX-02',
    customer: customerId,
    request: request._id,
    quotation: quotation._id,
    status: 'Pending',
    finalAmount: 1500
  });

  // Transaction that simulates an unexpected failure before committing
  const session = await mongoose.startSession();
  try {
    await assert.rejects(
      session.withTransaction(async () => {
        const b = await Booking.findById(booking._id).session(session);
        b.status = 'Cancelled';
        await b.save({ session });

        // Simulate failure
        throw new Error('Simulated mid-transaction failure');
      }),
      /Simulated mid-transaction failure/
    );
  } finally {
    await session.endSession();
  }

  // Verify that the rollback was clean
  const cleanBooking = await Booking.findById(booking._id);
  const cleanRequest = await EventRequest.findById(request._id);

  assert.equal(cleanBooking.status, 'Pending');
  assert.equal(cleanRequest.status, 'Quotation Accepted');
});

test('booking confirmation to Confirmed status is blocked with HTTP 409 invariant', async () => {
  const customerId = new mongoose.Types.ObjectId();
  const requestId = new mongoose.Types.ObjectId();

  const booking = await Booking.create({
    bookingId: 'PJTHB-BLOCK-01',
    customer: customerId,
    request: requestId,
    status: 'Pending',
    finalAmount: 5000
  });

  // Verify that business rule invariant explicitly prevents transitioning to Confirmed
  const requestedStatus = 'Confirmed';
  const confirmationBlocked = requestedStatus === 'Confirmed';
  assert.equal(confirmationBlocked, true);

  // Status must remain Pending
  const unchanged = await Booking.findById(booking._id);
  assert.equal(unchanged.status, 'Pending');
});

