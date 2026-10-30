/**
 * Comprehensive Validation Engine for Synthetic Business Data
 * Verifies relational integrity, chronological sanity, mathematical consistency,
 * and financial reconciliation before any database operation or export.
 */

class SyntheticDataValidator {
  constructor(data) {
    this.data = data;
    this.errors = [];
    this.warnings = [];
    this.metrics = {};
  }

  validateAll() {
    this.errors = [];
    this.warnings = [];

    console.log('[VALIDATOR] Starting comprehensive data validation pass...');

    this.validateReferences();
    this.validateUniqueness();
    this.validateChronology();
    this.validateMathematicalConsistency();
    this.computeFinancialReconciliation();

    const isValid = this.errors.length === 0;
    console.log(`[VALIDATOR] Validation complete. Status: ${isValid ? 'PASSED' : 'FAILED'} (${this.errors.length} errors, ${this.warnings.length} warnings)`);

    return {
      isValid,
      errors: this.errors,
      warnings: this.warnings,
      metrics: this.metrics
    };
  }

  validateReferences() {
    const { categories, items, customers, requests, quotations, bookings, payments, inventoryReservations, inventoryReturnInspections } = this.data;

    const catIdSet = new Set(categories.map((c) => String(c._id)));
    const itemIdSet = new Set(items.map((i) => String(i._id)));
    const custIdSet = new Set(customers.map((c) => String(c._id)));
    const reqIdSet = new Set(requests.map((r) => String(r._id)));
    const quotIdSet = new Set(quotations.map((q) => String(q._id)));
    const bookIdSet = new Set(bookings.map((b) => String(b._id)));
    const bookingCodeSet = new Set(bookings.map((b) => b.bookingId));
    const resIdSet = new Set(inventoryReservations.map((r) => String(r._id)));

    // 1. Items -> Category
    for (const item of items) {
      if (!catIdSet.has(String(item.category))) {
        this.errors.push(`Item ${item.name} references non-existent category ${item.category}`);
      }
    }

    // 2. Requests -> User & Items
    for (const req of requests) {
      if (!custIdSet.has(String(req.user))) {
        this.errors.push(`Request ${req.requestId} references non-existent user ${req.user}`);
      }
      for (const line of req.items) {
        if (!itemIdSet.has(String(line.item))) {
          this.errors.push(`Request ${req.requestId} line item references non-existent item ${line.item}`);
        }
      }
    }

    // 3. Quotations -> Request, Customer & Items
    for (const q of quotations) {
      if (!reqIdSet.has(String(q.request))) {
        this.errors.push(`Quotation ${q._id} references non-existent request ${q.request}`);
      }
      if (!custIdSet.has(String(q.customer))) {
        this.errors.push(`Quotation ${q._id} references non-existent customer ${q.customer}`);
      }
      for (const line of q.items) {
        if (!itemIdSet.has(String(line.item))) {
          this.errors.push(`Quotation ${q._id} line item references non-existent item ${line.item}`);
        }
      }
    }

    // 4. Bookings -> Customer, Request, Quotation
    for (const b of bookings) {
      if (!custIdSet.has(String(b.customer))) {
        this.errors.push(`Booking ${b.bookingId} references non-existent customer ${b.customer}`);
      }
      if (!reqIdSet.has(String(b.request))) {
        this.errors.push(`Booking ${b.bookingId} references non-existent request ${b.request}`);
      }
      if (b.quotation && !quotIdSet.has(String(b.quotation))) {
        this.errors.push(`Booking ${b.bookingId} references non-existent quotation ${b.quotation}`);
      }
    }

    // 5. Payments -> Booking
    for (const p of payments) {
      if (!bookingCodeSet.has(p.bookingId)) {
        this.errors.push(`Payment ${p.paymentId} references non-existent bookingId ${p.bookingId}`);
      }
    }

    // 6. Return Inspections -> Reservation
    for (const insp of inventoryReturnInspections) {
      if (!resIdSet.has(String(insp.reservation))) {
        this.errors.push(`Inspection ${insp._id} references non-existent reservation ${insp.reservation}`);
      }
    }
  }

  validateUniqueness() {
    const { customers, requests, bookings, inventoryReservations, inventoryReturnInspections } = this.data;

    const checkUnique = (array, keyFn, label) => {
      const seen = new Set();
      for (const item of array) {
        const val = keyFn(item);
        if (val == null) continue;
        if (seen.has(val)) {
          this.errors.push(`Duplicate unique key detected in ${label}: "${val}"`);
        }
        seen.add(val);
      }
    };

    checkUnique(customers, (c) => c.phone, 'Customer Phone');
    checkUnique(customers, (c) => c.email, 'Customer Email');
    checkUnique(requests, (r) => r.requestId, 'EventRequest requestId');
    checkUnique(bookings, (b) => b.bookingId, 'Booking bookingId');
    checkUnique(bookings, (b) => String(b.request), 'Booking request (unique index violation)');
    checkUnique(
      inventoryReservations,
      (r) => r.allocationIdempotencyKey,
      'InventoryReservation allocationIdempotencyKey'
    );
    checkUnique(
      inventoryReturnInspections.filter((i) => i.releaseIdempotencyKey),
      (i) => i.releaseIdempotencyKey,
      'InventoryReturnInspection releaseIdempotencyKey'
    );
  }

  validateChronology() {
    const { requests, quotations, bookings, payments, inventoryReturnInspections } = this.data;

    for (const r of requests) {
      if (r.startDate > r.endDate) {
        this.errors.push(`Request ${r.requestId} has startDate after endDate`);
      }
      if (r.createdAt > r.startDate) {
        this.errors.push(`Request ${r.requestId} created after event startDate`);
      }
    }

    const reqMap = new Map(requests.map((r) => [String(r._id), r]));
    for (const q of quotations) {
      const req = reqMap.get(String(q.request));
      if (req && q.createdAt < req.createdAt) {
        this.errors.push(`Quotation created before its associated request ${req.requestId}`);
      }
    }

    const quotMap = new Map(quotations.map((q) => [String(q._id), q]));
    for (const b of bookings) {
      if (b.quotation) {
        const q = quotMap.get(String(b.quotation));
        if (q && b.createdAt < q.createdAt) {
          this.errors.push(`Booking ${b.bookingId} created before its accepted quotation`);
        }
      }
      if (b.createdAt > b.eventDates.start) {
        this.warnings.push(`Booking ${b.bookingId} recorded after event start date (walk-in/emergency booking)`);
      }
    }

    const bookingMap = new Map(bookings.map((b) => [b.bookingId, b]));
    for (const p of payments) {
      const b = bookingMap.get(p.bookingId);
      if (b && p.paymentDate < b.createdAt) {
        this.errors.push(`Payment ${p.paymentId} dated before booking creation ${b.bookingId}`);
      }
    }
  }

  validateMathematicalConsistency() {
    const { quotations, bookings, payments } = this.data;

    // 1. Quotation item subtotal and finalTotal
    for (const q of quotations) {
      const computedItemTotal = q.items.reduce((acc, it) => {
        const expectedSubtotal = it.quantity * it.unitPrice;
        if (it.subtotal !== expectedSubtotal) {
          this.errors.push(`Quotation line item subtotal mismatch: expected ${expectedSubtotal}, found ${it.subtotal}`);
        }
        return acc + it.subtotal;
      }, 0);

      const expectedFinal =
        computedItemTotal +
        (q.decorationServices || 0) +
        (q.transportation || 0) +
        (q.additionalCharges || 0) -
        (q.discount || 0);

      if (q.finalTotal !== expectedFinal) {
        this.errors.push(
          `Quotation finalTotal mathematical error: expected ₹${expectedFinal}, found ₹${q.finalTotal}`
        );
      }
    }

    // 2. Booking finalAmount matches accepted quotation finalTotal
    const quotMap = new Map(quotations.map((q) => [String(q._id), q]));
    for (const b of bookings) {
      if (b.quotation) {
        const q = quotMap.get(String(b.quotation));
        if (q && b.finalAmount !== q.finalTotal) {
          this.errors.push(
            `Booking ${b.bookingId} amount ₹${b.finalAmount} does not match quotation finalTotal ₹${q.finalTotal}`
          );
        }
      }
    }

    // 3. Payment amounts per booking cannot exceed booking total
    const bookingPayments = {};
    for (const p of payments) {
      bookingPayments[p.bookingId] = (bookingPayments[p.bookingId] || 0) + p.amount;
    }

    for (const [bookingId, paidTotal] of Object.entries(bookingPayments)) {
      const b = this.data.bookings.find((bk) => bk.bookingId === bookingId);
      if (b && paidTotal > b.finalAmount) {
        this.errors.push(`Booking ${bookingId} has overpaid payments: paid ₹${paidTotal} > finalAmount ₹${b.finalAmount}`);
      }
    }
  }

  computeFinancialReconciliation() {
    const { bookings, quotations, payments } = this.data;

    const totalQuotedValue = quotations.reduce((acc, q) => acc + q.finalTotal, 0);
    const acceptedQuotationValue = quotations.filter((q) => q.status === 'Accepted').reduce((acc, q) => acc + q.finalTotal, 0);

    const totalBookedValue = bookings.reduce((acc, b) => acc + b.finalAmount, 0);
    const completedBookedValue = bookings.filter((b) => b.status === 'Completed').reduce((acc, b) => acc + b.finalAmount, 0);
    const pendingBookedValue = bookings.filter((b) => b.status === 'Pending').reduce((acc, b) => acc + b.finalAmount, 0);
    const confirmedBookedValue = bookings.filter((b) => b.status === 'Confirmed').reduce((acc, b) => acc + b.finalAmount, 0);
    const cancelledBookedValue = bookings.filter((b) => b.status === 'Cancelled').reduce((acc, b) => acc + b.finalAmount, 0);

    const actualCollectedCash = payments.filter((p) => p.status === 'Successful').reduce((acc, p) => acc + p.amount, 0);
    const advanceCashCollected = payments.filter((p) => p.status === 'Successful' && p.paymentType === 'Advance').reduce((acc, p) => acc + p.amount, 0);
    const settlementCashCollected = payments.filter((p) => p.status === 'Successful' && p.paymentType === 'FinalSettlement').reduce((acc, p) => acc + p.amount, 0);

    const activeBookedValue = completedBookedValue + pendingBookedValue + confirmedBookedValue;
    const outstandingReceivables = Math.max(0, activeBookedValue - actualCollectedCash);

    this.metrics = {
      totalQuotedValue,
      acceptedQuotationValue,
      totalBookedValue,
      completedBookedValue,
      pendingBookedValue,
      confirmedBookedValue,
      cancelledBookedValue,
      actualCollectedCash,
      advanceCashCollected,
      settlementCashCollected,
      activeBookedValue,
      outstandingReceivables
    };
  }
}

module.exports = {
  SyntheticDataValidator
};

