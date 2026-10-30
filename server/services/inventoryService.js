const DAY_MS = 24 * 60 * 60 * 1000;

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

const isValidTimestamp = (value) => {
  if (value == null || value === '') return false;
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp);
};

const normalizeDateOnlyUTC = (value) => {
  let date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch.map(Number);
      const normalized = new Date(Date.UTC(year, month - 1, day));
      if (
        normalized.getUTCFullYear() !== year
        || normalized.getUTCMonth() !== month - 1
        || normalized.getUTCDate() !== day
      ) {
        throw new RangeError('Date-only value is not a valid calendar date.');
      }
      return normalized;
    }
    date = new Date(value);
  } else {
    throw new TypeError('Date must be a Date instance or string.');
  }

  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Date is invalid.');
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const normalizeDateRange = (start, end) => {
  const normalizedStart = normalizeDateOnlyUTC(start);
  const normalizedEnd = normalizeDateOnlyUTC(end);

  if (normalizedEnd < normalizedStart) {
    throw new RangeError('End date must be on or after start date.');
  }

  return { start: normalizedStart, end: normalizedEnd };
};

const getRange = (record) => {
  const dates = record.eventDates || record;
  return normalizeDateRange(dates.start, dates.end);
};

const rangesOverlapInclusive = (first, second) => {
  const a = getRange(first);
  const b = getRange(second);
  return a.start <= b.end && a.end >= b.start;
};

const deduplicateById = (records, label) => {
  if (!Array.isArray(records)) {
    throw new TypeError(`${label} must be an array.`);
  }

  const unique = new Map();
  for (const record of records) {
    const id = getId(record?._id ?? record?.id);
    if (!id) {
      throw new TypeError(`${label} records must have an id.`);
    }
    if (unique.has(id)) {
      const existing = unique.get(id);
      if (existing !== record && JSON.stringify(existing) !== JSON.stringify(record)) {
        throw new Error(`${label} contains conflicting records with the same id.`);
      }
      continue;
    }
    unique.set(id, record);
  }
  return [...unique.values()];
};

const calculatePeakConcurrentQuantity = (records, range) => {
  const target = normalizeDateRange(range.start, range.end);
  const events = new Map();

  const addEvent = (day, quantity) => {
    events.set(day, (events.get(day) || 0) + quantity);
  };

  for (const record of deduplicateById(records, 'Reservations')) {
    if (!Number.isInteger(record.quantity) || record.quantity < 1) {
      throw new RangeError('Reservation quantity must be a positive integer.');
    }
    const dates = getRange(record);
    if (dates.end < target.start || dates.start > target.end) continue;

    const start = Math.max(dates.start.getTime(), target.start.getTime());
    const endExclusive = Math.min(dates.end.getTime(), target.end.getTime()) + DAY_MS;
    addEvent(start, record.quantity);
    addEvent(endExclusive, -record.quantity);
  }

  let concurrent = 0;
  let peak = 0;
  for (const [day, change] of [...events.entries()].sort(([a], [b]) => a - b)) {
    concurrent += change;
    peak = Math.max(peak, concurrent);
  }
  return peak;
};

const isVerifiedReservation = (reservation, bookingById) => {
  const booking = bookingById.get(getId(reservation.booking));
  return Boolean(
    booking
    && booking.inventoryVerificationStatus === 'Verified'
    && ['NewWorkflow', 'ManualReconciliation'].includes(reservation.provenance)
    && reservation.verificationStatus === 'Verified'
    && reservation.verifiedAt
    && getId(reservation.verifiedBy)
    && (
      reservation.provenance !== 'ManualReconciliation'
      || reservation.verificationEvidenceReference?.trim()
    )
    && ['Reserved', 'Released'].includes(reservation.status)
  );
};

const getAuthorizedInspectionReleases = (
  reservation,
  inspections,
  authorizedAdminIds,
  options = {}
) => {
  const reservationId = getId(reservation._id ?? reservation.id);
  const itemId = getId(reservation.item);
  const bookingId = getId(reservation.booking);
  // This is a trusted caller-provided allow-list, not authentication or role verification.
  const authorizedIds = new Set((authorizedAdminIds || []).map(getId));
  const sourceInspections = options.isDeduplicated ? inspections : deduplicateById(inspections, 'Return inspections');
  const releaseRecords = sourceInspections
    .filter((inspection) => (
      getId(inspection.reservation) === reservationId
      && getId(inspection.item) === itemId
      && getId(inspection.booking) === bookingId
      && inspection.inspectionOutcome === 'Passed'
      && inspection.releaseStatus === 'Released'
      && authorizedIds.has(getId(inspection.releasedBy))
    ));

  return releaseRecords.map((inspection) => {
    if (
      !Number.isInteger(inspection.releasedQuantity)
      || inspection.releasedQuantity < 1
      || !Number.isInteger(inspection.returnedQuantity)
      || inspection.returnedQuantity < inspection.releasedQuantity
      || !inspection.releasedAt
    ) {
      throw new RangeError('Released inspection requires a valid returned quantity, release quantity, and release date.');
    }
    return {
      id: getId(inspection._id ?? inspection.id),
      quantity: inspection.releasedQuantity,
      date: normalizeDateOnlyUTC(inspection.releasedAt)
    };
  });
};

const calculateOwnedPeak = ({
  itemId,
  range,
  reservations,
  inspections,
  bookings,
  authorizedAdminIds
}) => {
  const target = normalizeDateRange(range.start, range.end);
  const bookingById = new Map(
    deduplicateById(bookings, 'Bookings').map((booking) => [
      getId(booking._id ?? booking.id),
      booking
    ])
  );
  const uniqueReservations = deduplicateById(reservations, 'Reservations');
  const uniqueInspections = deduplicateById(inspections, 'Return inspections');
  const boundaries = new Set([
    target.start.getTime(),
    target.end.getTime() + DAY_MS
  ]);
  const eligible = [];

  for (const reservation of uniqueReservations) {
    if (
      reservation.source !== 'Owned'
      || getId(reservation.item) !== getId(itemId)
      || !isVerifiedReservation(reservation, bookingById)
    ) {
      continue;
    }
    if (!Number.isInteger(reservation.quantity) || reservation.quantity < 1) {
      throw new RangeError('Reservation quantity must be a positive integer.');
    }

    const dates = getRange(reservation);
    const releases = getAuthorizedInspectionReleases(
      reservation,
      uniqueInspections,
      authorizedAdminIds,
      { isDeduplicated: true }
    );
    const releasedQuantity = releases.reduce((total, release) => total + release.quantity, 0);
    if (releasedQuantity > reservation.quantity) {
      throw new RangeError('Released quantity cannot exceed the reserved quantity.');
    }
    if (reservation.status === 'Released' && releasedQuantity !== reservation.quantity) {
      throw new RangeError('Released reservation must have an authorized full-quantity inspection release.');
    }
    if (reservation.status === 'Released') {
      const releaseInspectionId = getId(reservation.releaseInspection);
      if (!releases.some((release) => release.id === releaseInspectionId)) {
        throw new Error('Released reservation must reference an eligible inspection release.');
      }
    }

    const start = dates.start.getTime();
    const eventEndExclusive = dates.end.getTime() + DAY_MS;
    if (start > target.start.getTime() && start < target.end.getTime() + DAY_MS) {
      boundaries.add(start);
    }
    if (eventEndExclusive > target.start.getTime() && eventEndExclusive < target.end.getTime() + DAY_MS) {
      boundaries.add(eventEndExclusive);
    }

    const effectiveReleases = releases
      .map((release) => ({
        ...release,
        effectiveDay: Math.max(release.date.getTime() + DAY_MS, eventEndExclusive)
      }))
      .sort((a, b) => a.effectiveDay - b.effectiveDay);
    for (const release of effectiveReleases) {
      if (release.effectiveDay > target.start.getTime() && release.effectiveDay < target.end.getTime() + DAY_MS) {
        boundaries.add(release.effectiveDay);
      }
    }
    eligible.push({ dates, effectiveReleases, quantity: reservation.quantity });
  }

  const sortedBoundaries = [...boundaries].sort((a, b) => a - b);
  let peak = 0;
  for (let index = 0; index < sortedBoundaries.length - 1; index += 1) {
    const day = sortedBoundaries[index];
    let concurrent = 0;
    for (const reservation of eligible) {
      const start = reservation.dates.start.getTime();
      const endExclusive = reservation.dates.end.getTime() + DAY_MS;
      if (day < start) continue;
      if (day < endExclusive) {
        concurrent += reservation.quantity;
        continue;
      }
      const releasedByDay = reservation.effectiveReleases
        .filter((release) => release.effectiveDay <= day)
        .reduce((total, release) => total + release.quantity, 0);
      concurrent += Math.max(0, reservation.quantity - releasedByDay);
    }
    peak = Math.max(peak, concurrent);
  }
  return peak;
};

const calculateSupplierAvailableQuantity = ({
  itemId,
  range,
  arrangements,
  reservations,
  bookings
}) => {
  const target = normalizeDateRange(range.start, range.end);
  const bookingById = new Map(
    deduplicateById(bookings, 'Bookings').map((booking) => [
      getId(booking._id ?? booking.id),
      booking
    ])
  );
  const uniqueArrangements = deduplicateById(arrangements, 'Supplier arrangements');
  const uniqueReservations = deduplicateById(reservations, 'Reservations');
  const commitmentIdentityCounts = new Map();
  for (const arrangement of uniqueArrangements) {
    if (
      getId(arrangement.item) !== getId(itemId)
      || !getId(arrangement.supplier)
      || !arrangement.supplierCommitmentReference?.trim()
      || !arrangement.supplierCommitmentLineIdentity?.trim()
      || !isValidTimestamp(arrangement.eventDates?.start)
      || !isValidTimestamp(arrangement.eventDates?.end)
      || new Date(arrangement.eventDates.end) < new Date(arrangement.eventDates.start)
    ) {
      continue;
    }
    const dates = getRange(arrangement);
    if (
      dates.start.getTime() !== target.start.getTime()
      || dates.end.getTime() !== target.end.getTime()
    ) {
      continue;
    }
    const identity = JSON.stringify([
      getId(arrangement.supplier),
      arrangement.supplierCommitmentReference.trim(),
      arrangement.supplierCommitmentLineIdentity.trim(),
      getId(arrangement.item),
      dates.start.toISOString(),
      dates.end.toISOString()
    ]);
    commitmentIdentityCounts.set(identity, (commitmentIdentityCounts.get(identity) || 0) + 1);
  }
  let available = 0;
  let reserved = 0;

  for (const arrangement of uniqueArrangements) {
    if (
      getId(arrangement.item) !== getId(itemId)
      || arrangement.commitmentVerificationStatus !== 'Verified'
      || !arrangement.supplierCommitmentReference?.trim()
      || !arrangement.supplierCommitmentLineIdentity?.trim()
      || !getId(arrangement.supplier)
      || !isValidTimestamp(arrangement.commitmentVerifiedAt)
      || !getId(arrangement.commitmentVerifiedBy)
      || !arrangement.commitmentVerificationEvidenceReference?.trim()
      || arrangement.supplyStatus !== 'SupplierConfirmed'
      || arrangement.status === 'Cancelled'
      || arrangement.cancellationReviewStatus === 'PendingReview'
      || arrangement.cancellationReviewStatus === 'SupplierConfirmed'
      || (
        arrangement.cancellationReviewStatus === 'AdminResolved'
        && (
          !isValidTimestamp(arrangement.cancellationResolvedAt)
          || !getId(arrangement.cancellationResolvedBy)
          || !arrangement.cancellationResolutionReason?.trim()
        )
      )
      || (
        arrangement.cancellationReviewStatus != null
        && !['NotRequested', 'AdminResolved'].includes(arrangement.cancellationReviewStatus)
      )
      || !isValidTimestamp(arrangement.supplyConfirmedAt)
      || !getId(arrangement.supplyConfirmedBy)
      || !Number.isInteger(arrangement.confirmedQuantity)
      || arrangement.confirmedQuantity < 1
      || !Number.isInteger(arrangement.quantity)
      || arrangement.quantity < arrangement.confirmedQuantity
    ) {
      continue;
    }
    const dates = getRange(arrangement);
    if (
      dates.start.getTime() !== target.start.getTime()
      || dates.end.getTime() !== target.end.getTime()
    ) {
      continue;
    }
    const identity = JSON.stringify([
      getId(arrangement.supplier),
      arrangement.supplierCommitmentReference.trim(),
      arrangement.supplierCommitmentLineIdentity.trim(),
      getId(arrangement.item),
      dates.start.toISOString(),
      dates.end.toISOString()
    ]);
    if (commitmentIdentityCounts.get(identity) !== 1) continue;

    let allocated = 0;
    let hasAllocationRecord = false;
    let hasUnverifiedAllocation = false;
    for (const reservation of uniqueReservations) {
      if (
        reservation.source !== 'Supplier'
        || getId(reservation.supplierArrangement) !== getId(arrangement._id ?? arrangement.id)
      ) {
        continue;
      }
      hasAllocationRecord = true;
      const booking = bookingById.get(getId(reservation.booking));
      if (
        !booking
        || booking.inventoryVerificationStatus !== 'Verified'
        || !['NewWorkflow', 'ManualReconciliation'].includes(reservation.provenance)
        || reservation.verificationStatus !== 'Verified'
        || !reservation.verifiedAt
        || !getId(reservation.verifiedBy)
      ) {
        hasUnverifiedAllocation = true;
        break;
      }
      if (
        getId(reservation.item) !== getId(itemId)
        || !['Reserved', 'Released'].includes(reservation.status)
      ) {
        throw new Error('Supplier allocation does not match its confirmed arrangement.');
      }
      const allocationDates = getRange(reservation);
      if (
        allocationDates.start.getTime() !== target.start.getTime()
        || allocationDates.end.getTime() !== target.end.getTime()
      ) {
        throw new Error('Supplier allocation dates do not match the confirmed arrangement.');
      }
      if (reservation.status === 'Reserved') {
        if (!Number.isInteger(reservation.quantity) || reservation.quantity < 1) {
          throw new RangeError('Supplier allocation quantity must be a positive integer.');
        }
        allocated += reservation.quantity;
      }
    }
    if (hasUnverifiedAllocation) continue;
    if (
      arrangement.allocationStatus === 'Reserved'
      && !hasAllocationRecord
    ) {
      continue;
    }
    if (
      arrangement.allocationStatus !== 'Reserved'
      && allocated > 0
    ) {
      throw new Error('Supplier allocation status conflicts with its active reservations.');
    }
    if (allocated > arrangement.confirmedQuantity) {
      throw new RangeError('Supplier allocations cannot exceed the confirmed quantity.');
    }
    available += arrangement.confirmedQuantity - allocated;
    reserved += allocated;
  }

  return { available, reserved };
};

const calculateItemAvailability = ({
  itemId,
  ownStock,
  range,
  reservations,
  inspections = [],
  bookings,
  authorizedAdminIds = [],
  supplierArrangements = []
}) => {
  if (!Number.isInteger(ownStock) || ownStock < 0) {
    throw new RangeError('Owned stock must be a non-negative integer.');
  }
  const ownedPeakConcurrentQuantity = calculateOwnedPeak({
    itemId,
    range,
    reservations,
    inspections,
    bookings,
    authorizedAdminIds
  });
  const supplierCapacity = calculateSupplierAvailableQuantity({
    itemId,
    range,
    arrangements: supplierArrangements,
    reservations,
    bookings
  });
  const ownedOverAllocatedQuantity = Math.max(0, ownedPeakConcurrentQuantity - ownStock);
  const ownedAvailableQuantity = Math.max(0, ownStock - ownedPeakConcurrentQuantity);

  return {
    ownedPeakConcurrentQuantity,
    ownedOverAllocatedQuantity,
    ownedAvailableQuantity,
    supplierReservedQuantity: supplierCapacity.reserved,
    supplierAvailableQuantity: supplierCapacity.available,
    availableQuantity: ownedAvailableQuantity + supplierCapacity.available
  };
};

const hasCompleteCoverage = (requestedItems, availabilityByItem) => {
  if (!Array.isArray(requestedItems)) {
    throw new TypeError('Requested items must be an array.');
  }

  const lines = deduplicateById(requestedItems, 'Requested items');
  const requiredByItem = new Map();
  for (const line of lines) {
    const itemId = getId(line.item);
    if (!itemId || !Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new RangeError('Requested item ids and quantities must be valid.');
    }
    requiredByItem.set(itemId, (requiredByItem.get(itemId) || 0) + line.quantity);
  }

  for (const [itemId, requiredQuantity] of requiredByItem) {
    const available = availabilityByItem instanceof Map
      ? availabilityByItem.get(itemId)
      : availabilityByItem?.[itemId];
    const availableQuantity = typeof available === 'number'
      ? available
      : available?.availableQuantity;
    if (!Number.isInteger(availableQuantity) || availableQuantity < requiredQuantity) {
      return false;
    }
  }
  return true;
};

module.exports = {
  calculateItemAvailability,
  calculatePeakConcurrentQuantity,
  hasCompleteCoverage,
  normalizeDateOnlyUTC,
  normalizeDateRange,
  rangesOverlapInclusive
};
