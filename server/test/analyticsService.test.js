const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAnalytics } = require('../services/analyticsService');

const asOf = new Date('2027-01-15T12:00:00.000Z');
const availabilityRange = {
  start: '2027-02-01',
  end: '2027-02-03'
};
const itemId = 'item-1';
const item = {
  _id: itemId,
  name: 'Banquet chair',
  category: { _id: 'category-furniture', name: 'Furniture' },
  ownStock: 4,
  status: 'active'
};
const makeRequest = (overrides = {}) => ({
  _id: 'request-default',
  createdAt: new Date('2026-12-01T10:00:00.000Z'),
  status: 'Submitted',
  startDate: new Date('2027-02-01T00:00:00.000Z'),
  endDate: new Date('2027-02-03T00:00:00.000Z'),
  items: [{ item: itemId, itemName: 'Banquet chair', quantity: 3 }],
  ...overrides
});
const makeBooking = (overrides = {}) => ({
  _id: 'booking-default',
  createdAt: new Date('2026-12-02T10:00:00.000Z'),
  status: 'Confirmed',
  finalAmount: 1250,
  request: null,
  eventDates: { start: new Date('2027-02-01T00:00:00.000Z'), end: new Date('2027-02-03T00:00:00.000Z') },
  items: [{ item: itemId, itemName: 'Banquet chair', quantity: 3 }],
  ...overrides
});
const build = (overrides = {}) => buildAnalytics({
  requests: [],
  bookings: [],
  items: [item],
  inventoryReservations: [],
  inspections: [],
  supplierArrangements: [],
  administrators: [],
  availabilityRange,
  asOf,
  ...overrides
});

test('empty analytics data returns zero rates and an explicit insufficient-data forecast', () => {
  const result = build();

  assert.equal(result.conversion.requestCount, 0);
  assert.equal(result.conversion.ratePercent, 0);
  assert.equal(result.cancellation.bookingCount, 0);
  assert.equal(result.cancellation.ratePercent, 0);
  assert.equal(result.bookedValue.amount, 0);
  assert.equal(result.forecast.status, 'InsufficientData');
  assert.deepEqual(result.forecast.forecastMonths, []);
  assert.equal(result.monthly.length, 12);
  assert.equal(result.seasonality.length, 12);
});

test('monthly metrics use persisted dates and booked value excludes estimates and cancelled bookings', () => {
  const request = makeRequest({ _id: 'request-1' });
  const result = build({
    requests: [request],
    bookings: [
      makeBooking({ _id: 'booking-1', request: 'request-1' }),
      makeBooking({ _id: 'booking-2', request: 'request-missing', status: 'Cancelled', finalAmount: 700 }),
      makeBooking({ _id: 'booking-3', request: 'request-1', status: 'Completed', finalAmount: 250 })
    ]
  });
  const december = result.monthly.find((entry) => entry.month === '2026-12');

  assert.equal(december.requests, 1);
  assert.equal(december.bookings, 3);
  assert.equal(december.bookedValue, 1500);
  assert.equal(result.bookedValue.amount, 1500);
  assert.equal(result.conversion.convertedRequestCount, 1);
  assert.equal(result.conversion.ratePercent, 100);
  assert.equal(result.cancellation.ratePercent, 33.33);
  assert.equal(result.seasonality.find((entry) => entry.month === 2).bookingCount, 2);
  assert.equal(result.popularItems[0].requestedQuantity, 3);
  assert.equal(result.popularItems[0].name, 'Banquet chair');
  assert.equal(result.popularCategories[0].name, 'Furniture');
  assert.equal(JSON.stringify(result).includes('requester@example.com'), false);
});

test('forecast uses a three-month moving average only with sufficient booking history', () => {
  const bookings = [
    ['2026-07-02', 1],
    ['2026-08-02', 1],
    ['2026-09-02', 1],
    ['2026-10-02', 4],
    ['2026-11-02', 5],
    ['2026-12-02', 6]
  ].flatMap(([date, count], monthIndex) => Array.from({ length: count }, (_, index) => (
    makeBooking({
      _id: `booking-${monthIndex}-${index}`,
      createdAt: new Date(`${date}T10:00:00.000Z`),
      status: 'Pending'
    })
  )));
  const result = build({ bookings });

  assert.equal(result.forecast.status, 'Available');
  assert.equal(result.forecast.historyMonths, 6);
  assert.equal(result.forecast.historyBookingCount, 18);
  assert.deepEqual(
    result.forecast.forecastMonths.map((month) => month.predictedBookings),
    [5, 5, 5]
  );
  assert.match(result.forecast.method, /Three-month moving average/);
});

test('request recommendations flag possible shortages and distinguish unverified capacity', () => {
  const request = makeRequest({ _id: 'request-demand', status: 'Under Review' });
  const result = build({
    requests: [request],
    items: [{ ...item, ownStock: 2 }]
  });

  assert.equal(result.inventoryRecommendations[0].requestedQuantity, 3);
  assert.equal(result.inventoryRecommendations[0].verifiedAvailableQuantity, 2);
  assert.equal(result.inventoryRecommendations[0].status, 'PotentialShortage');
  assert.equal(result.inventoryRecommendations[0].recommendation.includes('no stock action'), true);

  const unverified = build({
    requests: [request],
    items: [{ ...item, ownStock: 2 }],
    inventoryReservations: [{
      _id: 'legacy-reservation',
      booking: 'legacy-booking',
      item: itemId,
      quantity: 1,
      eventDates: { start: '2027-02-01', end: '2027-02-03' },
      source: 'Owned',
      status: 'Reserved',
      provenance: 'LegacyUnverified',
      verificationStatus: 'LegacyUnverified'
    }]
  });

  assert.equal(unverified.inventoryRecommendations[0].status, 'UnverifiedInventory');
  assert.equal(unverified.inventoryRecommendations[0].verifiedAvailableQuantity, null);
});

test('invalid analytics dates fail instead of generating misleading metrics', () => {
  assert.throws(
    () => build({ availabilityRange: { start: 'not-a-date', end: '2027-02-03' } }),
    /Availability date range is invalid/
  );
  assert.throws(
    () => build({ asOf: 'invalid' }),
    /Analytics reference date is invalid/
  );
});
