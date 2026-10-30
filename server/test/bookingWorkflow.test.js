const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const requestRoutes = require('../routes/requestRoutes');
const quotationRoutes = require('../routes/quotationRoutes');
const bookingRoutes = require('../routes/bookingRoutes');

const itemId = new mongoose.Types.ObjectId();
const requestId = new mongoose.Types.ObjectId();
const customerId = new mongoose.Types.ObjectId();
const quotationId = new mongoose.Types.ObjectId();

test('workflow helper tests do not open a database connection', () => {
  assert.equal(mongoose.connection.readyState, 0);
});

test('request helpers normalize inclusive dates and derive estimates from catalog prices', () => {
  const start = requestRoutes.parseRequestDate('2026-10-29');
  const end = requestRoutes.parseRequestDate('2026-10-31');

  assert.equal(requestRoutes.calculateInclusiveRentalDays(start, end), 3);
  assert.equal(requestRoutes.calculateItemEstimate(
    { basePrice: 125, priceUnit: 'Per Day' },
    2,
    3
  ), 750);
  assert.equal(requestRoutes.calculateItemEstimate(
    { basePrice: 125, priceUnit: 'Per Piece' },
    2,
    3
  ), 250);
  assert.throws(
    () => requestRoutes.validateRequestDetails('Not an event type', 'Jaipur'),
    /valid event type/
  );
  assert.throws(
    () => requestRoutes.validateRequestDetails('Wedding', '   '),
    /event location/
  );
  assert.doesNotThrow(
    () => requestRoutes.validateRequestDetails('Wedding', 'Jaipur')
  );
});

test('quotation lines retain server-owned item identity and quantity while validating prices', () => {
  const requestItems = [{
    item: itemId,
    itemName: 'Banquet chair',
    quantity: 3,
    estimatedPrice: 900
  }];
  const quoteItems = quotationRoutes.normalizeItems(requestItems, [{
    itemName: 'Banquet chair',
    quantity: 3,
    unitPrice: 250,
    subtotal: 750
  }]);

  assert.equal(quoteItems[0].item, itemId);
  assert.equal(quoteItems[0].quantity, 3);
  assert.equal(quoteItems[0].unitPrice, 250);
  assert.equal(quoteItems[0].subtotal, 750);
  assert.throws(
    () => quotationRoutes.normalizeItems(requestItems, [{
      item: new mongoose.Types.ObjectId(),
      itemName: 'Banquet chair',
      quantity: 3,
      unitPrice: 250
    }]),
    /cannot be edited/
  );
  assert.equal(quotationRoutes.calculateQuotationTotal(quoteItems, {
    decorationServices: 100,
    transportation: 50,
    additionalCharges: 0,
    discount: 25
  }), 875);
  assert.throws(
    () => quotationRoutes.calculateQuotationTotal(quoteItems, {
      decorationServices: 0,
      transportation: 0,
      additionalCharges: 0,
      discount: 1000
    }),
    /finite and non-negative/
  );
});

test('same quotation response is idempotent only when the request status agrees', () => {
  assert.equal(
    quotationRoutes.isMatchingQuotationResponse('Accepted', 'Quotation Accepted', 'Accepted'),
    true
  );
  assert.equal(
    quotationRoutes.isMatchingQuotationResponse('Rejected', 'Rejected', 'Rejected'),
    true
  );
  assert.equal(
    quotationRoutes.isMatchingQuotationResponse('Accepted', 'Quotation Accepted', 'Rejected'),
    false
  );
  assert.equal(
    quotationRoutes.isMatchingQuotationResponse('Accepted', 'Quotation Sent', 'Accepted'),
    false
  );
});

test('pending booking data derives customer, dates, item lines, and amount from persisted request and quotation', () => {
  const request = {
    _id: requestId,
    user: customerId,
    startDate: new Date('2026-10-29T00:00:00.000Z'),
    endDate: new Date('2026-10-31T00:00:00.000Z'),
    location: 'Event venue'
  };
  const quotation = {
    _id: quotationId,
    finalTotal: 875,
    items: [{
      item: itemId,
      itemName: 'Banquet chair',
      quantity: 3,
      unitPrice: 250,
      subtotal: 750
    }]
  };
  const booking = bookingRoutes.createPendingBookingData(request, quotation, 'PJTHB-1234');

  assert.equal(booking.customer, customerId);
  assert.equal(booking.request, requestId);
  assert.equal(booking.quotation, quotationId);
  assert.deepEqual(booking.eventDates, { start: request.startDate, end: request.endDate });
  assert.equal(booking.items[0].item, itemId);
  assert.equal(booking.items[0].quantity, 3);
  assert.equal(booking.finalAmount, 875);
  assert.equal(booking.status, 'Pending');
});
