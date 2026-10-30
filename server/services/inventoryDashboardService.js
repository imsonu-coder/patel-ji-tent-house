const {
  calculateItemAvailability,
  normalizeDateRange
} = require('./inventoryService');

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

const isVerifiedReservation = (reservation, booking) => Boolean(
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

const utcDay = (value) => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const hasValidMatchingDates = (reservation, booking) => {
  const reservationStart = utcDay(reservation.eventDates?.start);
  const reservationEnd = utcDay(reservation.eventDates?.end);
  const bookingStart = utcDay(booking.eventDates?.start);
  const bookingEnd = utcDay(booking.eventDates?.end);
  return reservationStart !== null
    && reservationEnd !== null
    && bookingStart !== null
    && bookingEnd !== null
    && reservationStart === bookingStart
    && reservationEnd === bookingEnd;
};

const isVerifiedBookingReservation = (reservation, booking, itemId) => {
  if (
    getId(reservation.booking) !== getId(booking._id)
    || getId(reservation.item) !== getId(itemId)
    || !isVerifiedReservation(reservation, booking)
    || !hasValidMatchingDates(reservation, booking)
    || !['Owned', 'Supplier'].includes(reservation.source)
    || !Number.isInteger(reservation.quantity)
    || reservation.quantity < 1
  ) {
    return false;
  }
  return true;
};

const hasUnverifiedOwnedReservation = (itemId, range, reservations, bookingsById) => {
  const target = normalizeDateRange(range.start, range.end);
  return reservations.some((reservation) => {
    if (
      reservation.source !== 'Owned'
      || getId(reservation.item) !== getId(itemId)
      || !['Reserved', 'Released'].includes(reservation.status)
    ) {
      return false;
    }
    const start = utcDay(reservation.eventDates?.start);
    const end = utcDay(reservation.eventDates?.end);
    if (start === null || end === null || end < start) return true;
    if (start > target.end.getTime()) return false;
    const booking = bookingsById.get(getId(reservation.booking));
    return !isVerifiedReservation(reservation, booking);
  });
};

const hasUnverifiedBooking = (itemId, range, bookings, reservations) => {
  const target = normalizeDateRange(range.start, range.end);
  return bookings.some((booking) => {
    if (!['Confirmed', 'Completed'].includes(booking.status)) return false;
    const bookingStart = utcDay(booking.eventDates?.start);
    const bookingEnd = utcDay(booking.eventDates?.end);
    if (bookingStart === null || bookingEnd === null || bookingEnd < bookingStart) {
      return (booking.items || []).some((line) => getId(line.item) === getId(itemId));
    }
    if (bookingStart > target.end.getTime()) return false;
    const requestedQuantity = (booking.items || [])
      .filter((line) => getId(line.item) === getId(itemId))
      .reduce((total, line) => total + (Number.isInteger(line.quantity) ? line.quantity : 0), 0);
    const reservedQuantity = reservations
      .filter((reservation) => isVerifiedBookingReservation(reservation, booking, itemId))
      .reduce((total, reservation) => total + reservation.quantity, 0);
    return (
      booking.inventoryVerificationStatus !== 'Verified'
      || requestedQuantity < 1
      || reservedQuantity !== requestedQuantity
    ) && (booking.items || []).some((line) => getId(line.item) === getId(itemId));
  });
};

const getSupplierIdentityKey = (arrangement) => {
  const start = utcDay(arrangement.eventDates?.start);
  const end = utcDay(arrangement.eventDates?.end);
  if (
    !getId(arrangement.supplier)
    || !getId(arrangement.item)
    || !arrangement.supplierCommitmentReference?.trim()
    || !arrangement.supplierCommitmentLineIdentity?.trim()
    || start === null
    || end === null
    || end < start
  ) {
    return null;
  }
  return JSON.stringify([
    getId(arrangement.supplier),
    arrangement.supplierCommitmentReference.trim(),
    arrangement.supplierCommitmentLineIdentity.trim(),
    getId(arrangement.item),
    start,
    end
  ]);
};

const buildInventoryDashboard = ({
  items,
  reservations,
  inspections,
  bookings,
  supplierArrangements,
  authorizedAdminIds,
  range
}) => {
  const target = normalizeDateRange(range.start, range.end);
  const bookingsById = new Map(bookings.map((booking) => [getId(booking._id), booking]));
  const supplierIdentityCounts = new Map();
  for (const arrangement of supplierArrangements) {
    const identity = getSupplierIdentityKey(arrangement);
    if (identity) {
      supplierIdentityCounts.set(identity, (supplierIdentityCounts.get(identity) || 0) + 1);
    }
  }
  const displayArrangements = supplierArrangements.map((arrangement) => {
    const identity = getSupplierIdentityKey(arrangement);
    const duplicateIdentity = identity && supplierIdentityCounts.get(identity) > 1;
    const data = typeof arrangement.toObject === 'function'
      ? arrangement.toObject()
      : { ...arrangement };
    return {
      ...data,
      inventoryAvailabilityNote: duplicateIdentity
        ? 'Duplicate supplier commitment identity; excluded from available capacity.'
        : undefined
    };
  });

  const reservationsByItem = new Map();
  for (const res of reservations) {
    const itemIdStr = getId(res.item);
    if (itemIdStr) {
      let list = reservationsByItem.get(itemIdStr);
      if (!list) {
        list = [];
        reservationsByItem.set(itemIdStr, list);
      }
      list.push(res);
    }
  }

  const inspectionsByItem = new Map();
  for (const insp of inspections) {
    const itemIdStr = getId(insp.item);
    if (itemIdStr) {
      let list = inspectionsByItem.get(itemIdStr);
      if (!list) {
        list = [];
        inspectionsByItem.set(itemIdStr, list);
      }
      list.push(insp);
    }
  }

  const bookingsByItem = new Map();
  for (const b of bookings) {
    const seenItems = new Set();
    for (const line of b.items || []) {
      const itemIdStr = getId(line.item);
      if (itemIdStr && !seenItems.has(itemIdStr)) {
        seenItems.add(itemIdStr);
        let list = bookingsByItem.get(itemIdStr);
        if (!list) {
          list = [];
          bookingsByItem.set(itemIdStr, list);
        }
        list.push(b);
      }
    }
  }

  const arrangementsByItem = new Map();
  for (const arr of supplierArrangements) {
    const itemIdStr = getId(arr.item);
    if (itemIdStr) {
      let list = arrangementsByItem.get(itemIdStr);
      if (!list) {
        list = [];
        arrangementsByItem.set(itemIdStr, list);
      }
      list.push(arr);
    }
  }

  const rows = items.map((item) => {
    const itemIdStr = getId(item._id);
    const itemReservations = reservationsByItem.get(itemIdStr) || [];
    const itemInspections = inspectionsByItem.get(itemIdStr) || [];
    const itemBookings = bookingsByItem.get(itemIdStr) || [];
    const itemArrangements = arrangementsByItem.get(itemIdStr) || [];

    const validStock = Number.isInteger(item.ownStock) && item.ownStock >= 0;
    const availability = validStock
      ? calculateItemAvailability({
        itemId: item._id,
        ownStock: item.ownStock,
        range: target,
        reservations: itemReservations,
        inspections: itemInspections,
        bookings: itemBookings,
        authorizedAdminIds,
        supplierArrangements: itemArrangements
      })
      : null;
    const unverified = (
      hasUnverifiedOwnedReservation(item._id, target, itemReservations, bookingsById)
      || hasUnverifiedBooking(item._id, target, itemBookings, itemReservations)
    );
    const overAllocated = Boolean(availability?.ownedOverAllocatedQuantity);
    const status = !validStock
      ? 'InvalidStock'
      : overAllocated
        ? 'OverAllocated'
        : unverified
          ? 'Unverified'
          : 'Verified';

    return {
      _id: item._id,
      name: item.name,
      category: item.category,
      status: item.status,
      ownStock: item.ownStock,
      ownedReservedQuantity: availability?.ownedPeakConcurrentQuantity ?? null,
      ownedOverAllocatedQuantity: availability?.ownedOverAllocatedQuantity ?? null,
      ownedAvailableQuantity: status === 'Verified'
        ? availability.ownedAvailableQuantity
        : status === 'OverAllocated'
          ? 0
          : null,
      supplierReservedQuantity: availability?.supplierReservedQuantity ?? 0,
      supplierAvailableQuantity: availability?.supplierAvailableQuantity ?? 0,
      availableQuantity: status === 'Verified'
        ? availability.availableQuantity
        : status === 'OverAllocated'
          ? availability.supplierAvailableQuantity
          : null,
      availabilityStatus: status
    };
  });

  return {
    range: { start: target.start, end: target.end },
    items: rows,
    supplierArrangements: displayArrangements,
    totals: {
      items: rows.length,
      ownedStock: rows.reduce((total, item) => (
        total + (Number.isInteger(item.ownStock) && item.ownStock >= 0 ? item.ownStock : 0)
      ), 0),
      verifiedSupplierAvailable: rows.reduce((total, item) => total + item.supplierAvailableQuantity, 0),
      unverifiedItems: rows.filter((item) => item.availabilityStatus === 'Unverified').length,
      overAllocatedItems: rows.filter((item) => item.availabilityStatus === 'OverAllocated').length,
      invalidStockItems: rows.filter((item) => item.availabilityStatus === 'InvalidStock').length
    }
  };
};

module.exports = { buildInventoryDashboard };
