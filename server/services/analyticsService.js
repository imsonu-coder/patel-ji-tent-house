const {
  buildInventoryDashboard
} = require('./inventoryDashboardService');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const FORECAST_MONTHS = 3;
const MIN_HISTORY_MONTHS = 6;
const MIN_HISTORY_BOOKINGS = 6;
const REVENUE_STATUSES = new Set(['Confirmed', 'Completed']);
const DEMAND_REQUEST_EXCLUDED_STATUSES = new Set(['Rejected', 'Cancelled']);

const getId = (value) => {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value._id && value._id !== value) {
      return getId(value._id);
    }
    if (typeof value.toString === 'function') {
      const str = value.toString();
      if (str !== '[object Object]') return str;
    }
  }
  return String(value);
};

const getValidDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getMonthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const shiftMonth = (date, offset) => new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth() + offset,
  1
));

const isValidRange = (range) => {
  if (!range || !range.start || !range.end) return false;
  const start = getValidDate(range.start);
  const end = getValidDate(range.end);
  return Boolean(start && end && start <= end);
};

const buildAnalytics = ({
  requests,
  bookings,
  items,
  inventoryReservations,
  inspections,
  supplierArrangements,
  administrators,
  availabilityRange,
  scope = 'real',
  asOf = new Date()
}) => {
  const referenceDate = getValidDate(asOf);
  if (!referenceDate) throw new RangeError('Analytics reference date is invalid.');
  if (!isValidRange(availabilityRange)) {
    throw new RangeError('Availability date range is invalid.');
  }

  const monthStart = new Date(Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    1
  ));
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const date = shiftMonth(monthStart, index - 11);
    return {
      month: getMonthKey(date),
      label: `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`,
      requests: 0,
      bookings: 0,
      bookedValue: 0
    };
  });
  const monthlyByKey = new Map(monthly.map((entry) => [entry.month, entry]));

  for (const request of requests) {
    const createdAt = getValidDate(request.createdAt);
    const bucket = createdAt && monthlyByKey.get(getMonthKey(createdAt));
    if (bucket) bucket.requests += 1;
  }

  let bookedValue = 0;
  let cancelledBookings = 0;
  const convertedRequestIds = new Set();
  const forecastHistory = [];
  const seasonalCounts = Array(12).fill(0);
  const requestedByItem = new Map();
  const demandByItem = new Map();
  const requestIds = new Set(requests.map((request) => getId(request._id)).filter(Boolean));
  const forecastBuckets = new Map(Array.from({ length: 12 }, (_, index) => {
    const date = shiftMonth(monthStart, index - 12);
    return [getMonthKey(date), 0];
  }));

  for (const booking of bookings) {
    const createdAt = getValidDate(booking.createdAt);
    const bucket = createdAt && monthlyByKey.get(getMonthKey(createdAt));
    if (bucket) bucket.bookings += 1;
    if (booking.status === 'Cancelled') cancelledBookings += 1;
    if (booking.request && requestIds.has(getId(booking.request))) {
      convertedRequestIds.add(getId(booking.request));
    }

    if (REVENUE_STATUSES.has(booking.status)) {
      const amount = Number(booking.finalAmount);
      if (Number.isFinite(amount) && amount >= 0) {
        bookedValue += amount;
        if (bucket) bucket.bookedValue += amount;
      }
    }

    if (booking.status !== 'Cancelled') {
      const eventDate = getValidDate(booking.eventDates?.start);
      if (eventDate) seasonalCounts[eventDate.getUTCMonth()] += 1;
    }

    if (createdAt && forecastBuckets.has(getMonthKey(createdAt)) && booking.status !== 'Cancelled') {
      forecastHistory.push(booking);
      forecastBuckets.set(
        getMonthKey(createdAt),
        forecastBuckets.get(getMonthKey(createdAt)) + 1
      );
    }

    for (const line of booking.items || []) {
      const itemId = getId(line.item);
      if (!itemId || !Number.isInteger(line.quantity) || line.quantity < 1) continue;
      const aggregate = demandByItem.get(itemId) || { quantity: 0, bookings: 0 };
      aggregate.quantity += line.quantity;
      aggregate.bookings += 1;
      demandByItem.set(itemId, aggregate);
    }
  }

  for (const request of requests) {
    if (DEMAND_REQUEST_EXCLUDED_STATUSES.has(request.status)) continue;
    const start = getValidDate(request.startDate);
    const end = getValidDate(request.endDate);
    if (
      !start
      || !end
      || end < getValidDate(availabilityRange.start)
      || start > getValidDate(availabilityRange.end)
    ) {
      continue;
    }
    for (const line of request.items || []) {
      const itemId = getId(line.item);
      if (!itemId || !Number.isInteger(line.quantity) || line.quantity < 1) continue;
      const aggregate = requestedByItem.get(itemId) || { quantity: 0, requests: 0, largestRequest: 0 };
      aggregate.quantity += line.quantity;
      aggregate.requests += 1;
      aggregate.largestRequest = Math.max(aggregate.largestRequest, line.quantity);
      requestedByItem.set(itemId, aggregate);
    }
  }

  const categoryById = new Map(items.map((item) => [
    getId(item._id),
    {
      id: getId(item.category),
      name: item.category?.name || 'Uncategorized'
    }
  ]));
  const itemNameById = new Map(items.map((item) => [getId(item._id), item.name]));
  const popularItemIds = new Set([
    ...requestedByItem.keys(),
    ...demandByItem.keys()
  ]);
  const popularItems = [...popularItemIds].map((itemId) => {
    const requested = requestedByItem.get(itemId) || { quantity: 0, requests: 0 };
    const booked = demandByItem.get(itemId) || { quantity: 0, bookings: 0 };
    return {
      itemId,
      name: itemNameById.get(itemId) || 'Historical item',
      category: categoryById.get(itemId)?.name || 'Uncategorized',
      requestedQuantity: requested.quantity,
      requestCount: requested.requests,
      bookedQuantity: booked.quantity,
      bookingLineCount: booked.bookings
    };
  }).sort((a, b) => (
    b.requestedQuantity - a.requestedQuantity
    || b.bookedQuantity - a.bookedQuantity
    || a.name.localeCompare(b.name)
  ));

  const popularCategoriesMap = new Map();
  for (const entry of popularItems) {
    const categoryId = categoryById.get(entry.itemId)?.id || 'uncategorized';
    const aggregate = popularCategoriesMap.get(categoryId) || {
      categoryId,
      name: entry.category,
      requestedQuantity: 0,
      requestCount: 0,
      bookedQuantity: 0
    };
    aggregate.requestedQuantity += entry.requestedQuantity;
    aggregate.requestCount += entry.requestCount;
    aggregate.bookedQuantity += entry.bookedQuantity;
    popularCategoriesMap.set(categoryId, aggregate);
  }
  const popularCategories = [...popularCategoriesMap.values()]
    .sort((a, b) => b.requestedQuantity - a.requestedQuantity || a.name.localeCompare(b.name));

  const seasonality = seasonalCounts.map((bookingCount, monthIndex) => ({
    month: monthIndex + 1,
    label: MONTHS[monthIndex],
    bookingCount
  }));
  const forecastHistoryMonths = [...forecastBuckets.values()].filter((count) => count > 0).length;
  const forecastEligible = (
    forecastHistoryMonths >= MIN_HISTORY_MONTHS
    && forecastHistory.length >= MIN_HISTORY_BOOKINGS
  );
  const forecast = {
    status: forecastEligible ? 'Available' : 'InsufficientData',
    method: 'Three-month moving average of non-cancelled booking creation counts',
    historyMonths: forecastHistoryMonths,
    historyBookingCount: forecastHistory.length,
    requiredHistoryMonths: MIN_HISTORY_MONTHS,
    requiredBookings: MIN_HISTORY_BOOKINGS,
    forecastMonths: forecastEligible
      ? Array.from({ length: FORECAST_MONTHS }, (_, index) => {
        const date = shiftMonth(monthStart, index + 1);
        const latestThreeMonthAverage = [...forecastBuckets.values()]
          .slice(-3)
          .reduce((sum, count) => sum + count, 0) / 3;
        return {
          month: getMonthKey(date),
          label: `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`,
          predictedBookings: Number(latestThreeMonthAverage.toFixed(2))
        };
      })
      : [],
    limitations: [
      'A short moving average is a planning estimate, not a machine-learning model or a guarantee.',
      'Historical completeness and future changes in pricing, capacity, and customer behavior are not known.',
      'No payment records exist; booked value is not verified cash received.'
    ]
  };

  const inventory = buildInventoryDashboard({
    items,
    reservations: inventoryReservations,
    inspections,
    bookings,
    supplierArrangements,
    authorizedAdminIds: administrators.map((admin) => admin._id),
    range: availabilityRange
  });
  const inventoryByItemId = new Map(inventory.items.map((item) => [getId(item._id), item]));
  const inventoryRecommendations = [...requestedByItem.entries()].map(([itemId, demand]) => {
    const stock = inventoryByItemId.get(itemId);
    let status = 'NoInventoryRecord';
    if (stock) {
      if (stock.availabilityStatus !== 'Verified') {
        status = 'UnverifiedInventory';
      } else if (stock.availableQuantity < demand.largestRequest) {
        status = 'PotentialShortage';
      } else {
        status = 'NoImmediateShortage';
      }
    }
    return {
      itemId,
      itemName: stock?.name || 'Historical item',
      requestedQuantity: demand.quantity,
      requestCount: demand.requests,
      largestSingleRequest: demand.largestRequest,
      verifiedAvailableQuantity: stock?.availabilityStatus === 'Verified'
        ? stock.availableQuantity
        : null,
      status,
      recommendation: status === 'PotentialShortage'
        ? 'Review capacity for upcoming requests; no stock action was taken.'
        : status === 'UnverifiedInventory'
          ? 'Verify legacy inventory before relying on its capacity.'
          : status === 'NoInventoryRecord'
            ? 'Review the catalogue mapping before making a capacity decision.'
            : 'No shortage indicated by this snapshot; availability is not reserved.'
    };
  }).sort((a, b) => (
    (a.status === 'PotentialShortage' ? 0 : 1)
    - (b.status === 'PotentialShortage' ? 0 : 1)
    || b.requestedQuantity - a.requestedQuantity
  ));

  return {
    scope: ['real', 'synthetic', 'all', 'combined'].includes(scope) ? scope : 'real',
    asOf: referenceDate,
    availabilityRange: {
      start: getValidDate(availabilityRange.start),
      end: getValidDate(availabilityRange.end)
    },
    monthly,
    popularItems,
    popularCategories,
    seasonality,
    forecast,
    inventoryRecommendations,
    conversion: {
      requestCount: requests.length,
      convertedRequestCount: convertedRequestIds.size,
      ratePercent: requests.length
        ? Number(((convertedRequestIds.size / requests.length) * 100).toFixed(2))
        : 0
    },
    cancellation: {
      bookingCount: bookings.length,
      cancelledCount: cancelledBookings,
      ratePercent: bookings.length
        ? Number(((cancelledBookings / bookings.length) * 100).toFixed(2))
        : 0
    },
    bookedValue: {
      amount: Number(bookedValue.toFixed(2)),
      currency: 'INR',
      includedStatuses: [...REVENUE_STATUSES],
      description: 'Persisted confirmed/completed booking value; not payment receipts.'
    },
    availabilitySummary: inventory.totals
  };
};

module.exports = { buildAnalytics };
