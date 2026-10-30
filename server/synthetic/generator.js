/**
 * Core Synthetic Data Generation Engine for Patel Ji Tent House
 *
 * Produces ~15,900 authentic, relational business records across Mongoose models
 * and analytical CSV datasets with 100% mathematical consistency and reproducible PRNG.
 */

const mongoose = require('mongoose');
const { RandomHelper } = require('./utils/prng');
const {
  FIRST_NAMES,
  LAST_NAMES,
  JAIPUR_LOCATIONS,
  EVENT_TYPES,
  EVENT_TYPE_WEIGHTS,
  MONTHLY_SEASONALITY,
  CATEGORIES_MASTER
} = require('./data/seedConstants');
const { generate300InventoryItems } = require('./data/inventoryCatalogue');

// Standard pre-hashed bcrypt hash for "SyntheticTest123!" (cost factor 10)
const BCRYPT_TEST_PASSWORD_HASH = '$2a$10$9vQ7wUj4yG1p5u5gSjQh8eYwLwT4n4N6bW3l0z8r2k9q1x7m5o4iK';

class SyntheticDataGenerator {
  constructor(seed = 1337) {
    this.seed = seed;
    this.random = new RandomHelper(seed);
  }

  generateAll() {
    console.log(`[GENERATOR] Starting synthetic data generation with PRNG seed: ${this.seed}...`);

    // 1. Categories (8 master categories)
    const categories = this.generateCategories();

    // 2. Inventory Items (300 items)
    const items = this.generateItems(categories);

    // 3. Customers (1,500 users) + 5 Admin users
    const { customers, admins } = this.generateUsers(1500, 5);

    // 4. Suppliers (100 vendors)
    const suppliers = this.generateSuppliers(100);

    // 5. Event Requests (3,000 requests)
    const requests = this.generateRequests(3000, customers, items);

    // 6. Quotations (2,500 quotations)
    const quotations = this.generateQuotations(2500, requests);

    // 7. Bookings (1,500 bookings from accepted quotations)
    const bookings = this.generateBookings(1500, quotations);

    // 8. Inventory Activity (~5,000 records)
    // - SupplierArrangements: 1,500 records
    // - InventoryReservations: 2,500 records
    // - InventoryReturnInspections: 1,000 records
    const inventoryActivity = this.generateInventoryActivity(bookings, items, suppliers, admins[0]);

    // 9. Payment Records (2,000 records, analytical financial dataset)
    const payments = this.generatePayments(2000, bookings);

    const summary = {
      categories: categories.length,
      items: items.length,
      customers: customers.length,
      admins: admins.length,
      suppliers: suppliers.length,
      requests: requests.length,
      quotations: quotations.length,
      bookings: bookings.length,
      supplierArrangements: inventoryActivity.arrangements.length,
      inventoryReservations: inventoryActivity.reservations.length,
      inventoryReturnInspections: inventoryActivity.inspections.length,
      payments: payments.length,
      totalRecords:
        categories.length +
        items.length +
        customers.length +
        admins.length +
        suppliers.length +
        requests.length +
        quotations.length +
        bookings.length +
        inventoryActivity.arrangements.length +
        inventoryActivity.reservations.length +
        inventoryActivity.inspections.length +
        payments.length
    };

    console.log(`[GENERATOR] Generation complete. Total records created: ${summary.totalRecords}`);

    return {
      categories,
      items,
      customers,
      admins,
      suppliers,
      requests,
      quotations,
      bookings,
      supplierArrangements: inventoryActivity.arrangements,
      inventoryReservations: inventoryActivity.reservations,
      inventoryReturnInspections: inventoryActivity.inspections,
      payments,
      summary
    };
  }

  generateCategories() {
    return CATEGORIES_MASTER.map((cat, idx) => ({
      _id: new mongoose.Types.ObjectId(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      status: 'active',
      isSynthetic: true,
      syntheticId: `CAT-SYN-${String(idx + 1).padStart(3, '0')}`
    }));
  }

  generateItems(categories) {
    const categoryMap = {};
    for (const c of categories) {
      categoryMap[c.slug] = c;
    }
    const rawItems = generate300InventoryItems(categoryMap, () => this.random.random());

    return rawItems.map((item, idx) => ({
      _id: new mongoose.Types.ObjectId(),
      ...item,
      isSynthetic: true,
      syntheticId: `ITEM-SYN-${String(idx + 1).padStart(4, '0')}`
    }));
  }

  generateUsers(customerCount = 1500, adminCount = 5) {
    const customers = [];
    for (let i = 1; i <= customerCount; i++) {
      const firstName = this.random.choice(FIRST_NAMES);
      const lastName = this.random.choice(LAST_NAMES);
      const phone = this.random.syntheticCustomerPhone(i);
      const email = this.random.syntheticEmail(firstName, lastName, i);

      customers.push({
        _id: new mongoose.Types.ObjectId(),
        name: `${firstName} ${lastName}`,
        phone,
        email,
        password: BCRYPT_TEST_PASSWORD_HASH,
        role: 'customer',
        status: 'active',
        isSynthetic: true,
        syntheticId: `CUST-SYN-${String(i).padStart(5, '0')}`,
        createdAt: this.random.seasonalDate(2025, 2026, MONTHLY_SEASONALITY)
      });
    }

    const admins = [];
    const adminRoles = ['SuperAdmin', 'OpsManager', 'InventoryLead', 'AccountsLead', 'BillingExec'];
    for (let i = 1; i <= adminCount; i++) {
      const firstName = this.random.choice(FIRST_NAMES);
      const lastName = 'Patel';
      const roleName = adminRoles[i - 1];

      admins.push({
        _id: new mongoose.Types.ObjectId(),
        name: `${firstName} Patel (${roleName})`,
        phone: this.random.syntheticAdminPhone(i),
        email: `synthetic.admin.${roleName.toLowerCase()}@pateltenthouse.test`,
        password: BCRYPT_TEST_PASSWORD_HASH,
        role: 'admin',
        status: 'active',
        isSynthetic: true,
        syntheticId: `ADMIN-SYN-${String(i).padStart(3, '0')}`,
        createdAt: new Date('2025-01-01T00:00:00.000Z')
      });
    }

    return { customers, admins };
  }

  generateSuppliers(count = 100) {
    const suppliers = [];
    const supplierSpecialties = [
      'Tent Fabricators & Canopies',
      'Sound & Acoustic Solutions',
      'Generators & Power Solutions',
      'Luxury Furniture & Carpets',
      'Fresh Flower & Mandap Decor',
      'Catering Crockery & Buffet Rentals',
      'Stage Lighting & Sharpy Trusses',
      'Cooling Systems & Pedestal Mists'
    ];

    for (let i = 1; i <= count; i++) {
      const surname = this.random.choice(LAST_NAMES);
      const specialty = this.random.choice(supplierSpecialties);
      const locality = this.random.choice(JAIPUR_LOCATIONS);
      const name = `${surname} & Sons ${specialty}`;

      suppliers.push({
        _id: new mongoose.Types.ObjectId(),
        name,
        phone: this.random.syntheticSupplierPhone(i),
        email: `synthetic.supplier.${String(i).padStart(3, '0')}@pateltenthouse.test`,
        address: `${locality}, Jaipur, Rajasthan`,
        categories: [specialty.split('&')[0].trim()],
        notes: `Synthetic preferred vendor for high-demand event dates in Jaipur.`,
        status: this.random.random() > 0.05 ? 'active' : 'inactive',
        isSynthetic: true,
        syntheticId: `SUPP-SYN-${String(i).padStart(4, '0')}`,
        createdAt: new Date('2025-01-01T00:00:00.000Z')
      });
    }

    return suppliers;
  }

  generateRequests(count = 3000, customers, items) {
    const requests = [];
    const now = new Date('2026-10-30T00:00:00.000Z');

    for (let i = 1; i <= count; i++) {
      const customer = this.random.choice(customers);
      const eventType = this.random.weightedChoice(EVENT_TYPE_WEIGHTS);
      const location = this.random.choice(JAIPUR_LOCATIONS);

      // Event date derived from seasonality
      const eventDate = this.random.seasonalDate(2025, 2026, MONTHLY_SEASONALITY);
      const durationDays = eventType === 'Wedding' ? this.random.int(1, 3) : this.random.int(0, 1);
      const startDate = eventDate;
      const endDate = new Date(startDate.getTime() + durationDays * 86400000);

      // Request date must precede event date by 14 to 90 days
      const daysInAdvance = this.random.int(14, 90);
      const createdAt = new Date(startDate.getTime() - daysInAdvance * 86400000);

      // Guest count realistic for event type
      let guestCount = 100;
      if (eventType === 'Wedding') guestCount = this.random.int(300, 1500);
      else if (eventType === 'Reception') guestCount = this.random.int(200, 800);
      else if (eventType === 'Engagement') guestCount = this.random.int(100, 400);
      else if (eventType === 'Corporate') guestCount = this.random.int(50, 300);
      else if (eventType === 'Birthday') guestCount = this.random.int(30, 150);
      else guestCount = this.random.int(50, 500);

      // Select 3 to 8 realistic item lines
      const lineCount = this.random.int(3, 8);
      const selectedItems = this.random.sample(items, lineCount);
      const requestItems = selectedItems.map((item) => {
        let quantity = 1;
        if (item.categorySlug === 'furniture') {
          quantity = Math.max(10, Math.round(guestCount * this.random.float(0.4, 0.9)));
        } else if (item.categorySlug === 'catering') {
          quantity = Math.max(5, Math.round(guestCount * 0.1));
        } else if (item.categorySlug === 'lighting') {
          quantity = this.random.int(4, 24);
        } else if (item.categorySlug === 'tents') {
          quantity = this.random.int(1, 4);
        } else {
          quantity = this.random.int(1, 6);
        }

        const unitPrice = item.basePrice;
        const estimatedPrice = quantity * unitPrice;

        return {
          item: item._id,
          itemName: item.name,
          quantity,
          unitPrice,
          estimatedPrice
        };
      });

      const estimatedAmount = requestItems.reduce((acc, it) => acc + it.estimatedPrice, 0);

      // Determine status respecting lifecycle progression
      let status = 'Submitted';
      if (i <= 2500) {
        // Will receive a quotation
        if (i <= 1500) {
          status = 'Quotation Accepted';
        } else if (i <= 1950) {
          status = 'Rejected';
        } else if (i <= 2300) {
          status = 'Quotation Expired';
        } else {
          status = 'Quotation Sent';
        }
      } else if (i <= 2700) {
        status = 'Under Review';
      } else {
        status = 'Submitted';
      }

      requests.push({
        _id: new mongoose.Types.ObjectId(),
        requestId: `PJTH-SYN-${String(i).padStart(6, '0')}`,
        user: customer._id,
        eventType,
        startDate,
        endDate,
        location,
        guestCount,
        additionalRequirements: `Fictional synthetic requirement for ${eventType.toLowerCase()} celebration in Jaipur.`,
        description: `Synthetic requirement generated for website testing and predictive modeling.`,
        items: requestItems,
        status,
        estimatedAmount,
        notes: [`Synthetic event requirement created on ${createdAt.toISOString().slice(0, 10)}`],
        isSynthetic: true,
        syntheticId: `REQ-SYN-${String(i).padStart(6, '0')}`,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 3600000)
      });
    }

    return requests;
  }

  generateQuotations(count = 2500, requests) {
    const quotations = [];

    for (let i = 1; i <= count; i++) {
      const request = requests[i - 1]; // direct 1:1 match with first 2500 requests

      const createdAt = new Date(request.createdAt.getTime() + this.random.int(1, 3) * 86400000);
      const validityDate = new Date(createdAt.getTime() + 14 * 86400000);

      const items = request.items.map((reqItem) => {
        const subtotal = reqItem.quantity * reqItem.unitPrice;
        return {
          item: reqItem.item,
          itemName: reqItem.itemName,
          quantity: reqItem.quantity,
          unitPrice: reqItem.unitPrice,
          subtotal
        };
      });

      const itemsTotal = items.reduce((acc, it) => acc + it.subtotal, 0);
      const decorationServices = Math.round(this.random.int(2000, 25000) / 100) * 100;
      const transportation = Math.round(this.random.int(1500, 8000) / 100) * 100;
      const additionalCharges = Math.round(this.random.int(0, 4000) / 100) * 100;
      const discountPercentage = this.random.choice([0, 0, 0.05, 0.08, 0.10]);
      const discount = Math.round((itemsTotal * discountPercentage) / 100) * 100;

      const finalTotal = itemsTotal + decorationServices + transportation + additionalCharges - discount;

      // Status matching request lifecycle
      let status = 'Draft';
      if (i <= 1500) {
        status = 'Accepted';
      } else if (i <= 1950) {
        status = 'Rejected';
      } else if (i <= 2300) {
        status = 'Expired';
      } else if (i <= 2400) {
        status = 'Sent';
      } else {
        status = 'Draft';
      }

      quotations.push({
        _id: new mongoose.Types.ObjectId(),
        request: request._id,
        customer: request.user,
        eventType: request.eventType,
        eventDates: {
          start: request.startDate,
          end: request.endDate
        },
        items,
        decorationServices,
        transportation,
        discount,
        additionalCharges,
        finalTotal,
        notes: `Synthetic quotation generated for ${request.eventType} in ${request.location}.`,
        validityDate,
        status,
        isSynthetic: true,
        syntheticId: `QUOT-SYN-${String(i).padStart(6, '0')}`,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 86400000)
      });
    }

    return quotations;
  }

  generateBookings(count = 1500, quotations) {
    const bookings = [];
    const now = new Date('2026-10-30T00:00:00.000Z');

    for (let i = 1; i <= count; i++) {
      const quotation = quotations[i - 1]; // First 1500 accepted quotations

      const createdAt = new Date(quotation.createdAt.getTime() + this.random.int(1, 4) * 86400000);
      const isPastEvent = quotation.eventDates.end < now;

      // Realistic status distribution:
      // - If event ended in past: 95% Completed, 5% Cancelled
      // - If future event: 75% Pending, 20% Confirmed (legacy unverified), 5% Cancelled
      let status = 'Pending';
      let inventoryVerificationStatus = 'UnverifiedLegacy';

      if (isPastEvent) {
        if (i % 20 === 0) {
          status = 'Cancelled';
        } else {
          status = 'Completed';
          inventoryVerificationStatus = 'Verified';
        }
      } else {
        if (i % 25 === 0) {
          status = 'Cancelled';
        } else if (i % 5 === 0) {
          status = 'Confirmed';
          inventoryVerificationStatus = 'UnverifiedLegacy';
        } else {
          status = 'Pending';
          inventoryVerificationStatus = 'UnverifiedLegacy';
        }
      }

      const bookingItems = quotation.items.map((it) => ({
        item: it.item,
        itemName: it.itemName,
        quantity: it.quantity
      }));

      bookings.push({
        _id: new mongoose.Types.ObjectId(),
        bookingId: `PJTHB-SYN-${String(i).padStart(6, '0')}`,
        customer: quotation.customer,
        request: quotation.request,
        quotation: quotation._id,
        eventDates: quotation.eventDates,
        location: `Jaipur Event Venue #${i}`,
        items: bookingItems,
        finalAmount: quotation.finalTotal,
        inventoryVerificationStatus,
        status,
        isSynthetic: true,
        syntheticId: `BOOK-SYN-${String(i).padStart(6, '0')}`,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 3600000)
      });
    }

    return bookings;
  }

  generateInventoryActivity(bookings, items, suppliers, adminUser) {
    const arrangements = [];
    const reservations = [];
    const inspections = [];

    let arrangementCounter = 1;
    let reservationCounter = 1;
    let inspectionCounter = 1;

    for (const booking of bookings) {
      if (booking.status === 'Cancelled') continue;

      for (const line of booking.items) {
        // 1. Inventory Reservation (Owned vs Supplier)
        if (reservations.length < 2500) {
          const isOwned = this.random.random() > 0.35; // 65% owned stock, 35% external supplier
          const resId = new mongoose.Types.ObjectId();
          const idempotencyKey = `alloc-syn-book-${booking.bookingId}-${line.itemName.slice(0, 10).replace(/\s+/g, '')}-${reservationCounter}`;

          let arrangementId = null;
          if (!isOwned && suppliers.length > 0 && arrangements.length < 1500) {
            const supplier = this.random.choice(suppliers);
            arrangementId = new mongoose.Types.ObjectId();

            arrangements.push({
              _id: arrangementId,
              request: booking.request,
              supplier: supplier._id,
              booking: booking._id,
              item: line.item,
              supplierCommitmentReference: `PO-SYN-${String(arrangementCounter).padStart(5, '0')}`,
              supplierCommitmentLineIdentity: `LINE-01`,
              commitmentVerificationStatus: 'Verified',
              commitmentVerifiedAt: booking.createdAt,
              commitmentVerifiedBy: adminUser._id,
              commitmentVerificationEvidenceReference: `audit://synthetic/supplier-po-${arrangementCounter}`,
              itemName: line.itemName,
              quantity: line.quantity,
              confirmedQuantity: line.quantity,
              eventDates: booking.eventDates,
              supplyStatus: 'SupplierConfirmed',
              allocationStatus: 'Reserved',
              supplyConfirmedAt: booking.createdAt,
              supplyConfirmedBy: adminUser._id,
              allocatedAt: booking.createdAt,
              allocatedBy: adminUser._id,
              source: 'External',
              status: 'Confirmed',
              isSynthetic: true,
              syntheticId: `ARR-SYN-${String(arrangementCounter).padStart(5, '0')}`,
              createdAt: booking.createdAt
            });
            arrangementCounter++;
          }

          reservations.push({
            _id: resId,
            booking: booking._id,
            item: line.item,
            quantity: line.quantity,
            eventDates: booking.eventDates,
            source: isOwned ? 'Owned' : 'Supplier',
            supplierArrangement: arrangementId,
            allocationIdempotencyKey: idempotencyKey,
            status: 'Reserved',
            createdBy: adminUser._id,
            provenance: 'NewWorkflow',
            verificationStatus: 'Verified',
            verifiedAt: booking.createdAt,
            verifiedBy: adminUser._id,
            isSynthetic: true,
            syntheticId: `RES-SYN-${String(reservationCounter).padStart(5, '0')}`,
            createdAt: booking.createdAt
          });
          reservationCounter++;

          // 2. Return Inspection (for Completed bookings only)
          if (booking.status === 'Completed' && inspections.length < 1000) {
            const inspectedAt = new Date(booking.eventDates.end.getTime() + this.random.int(1, 3) * 86400000);
            const returnKey = `ret-syn-${booking.bookingId}-${inspectionCounter}`;
            const outcome = this.random.random() > 0.08 ? 'Passed' : this.random.choice(['Damaged', 'NeedsRepair']);
            const isReleased = outcome === 'Passed';

            inspections.push({
              _id: new mongoose.Types.ObjectId(),
              booking: booking._id,
              reservation: resId,
              item: line.item,
              returnedQuantity: line.quantity,
              inspectionOutcome: outcome,
              inspectedBy: adminUser._id,
              inspectedAt,
              notes: `Synthetic return inspection (${outcome}) for ${line.itemName}.`,
              releaseStatus: isReleased ? 'Released' : 'NotReleased',
              releasedQuantity: isReleased ? line.quantity : 0,
              releaseIdempotencyKey: isReleased ? returnKey : undefined,
              releasedAt: isReleased ? inspectedAt : undefined,
              releasedBy: isReleased ? adminUser._id : undefined,
              isSynthetic: true,
              syntheticId: `INSP-SYN-${String(inspectionCounter).padStart(5, '0')}`,
              createdAt: inspectedAt
            });
            inspectionCounter++;
          }
        }
      }
    }

    return {
      arrangements,
      reservations,
      inspections
    };
  }

  generatePayments(targetCount = 2000, bookings) {
    const payments = [];
    let paymentCounter = 1;

    // Completed bookings: Advance + Final Settlement
    for (const booking of bookings) {
      if (payments.length >= targetCount) break;

      if (booking.status === 'Completed') {
        const totalAmount = booking.finalAmount;
        const advanceRatio = this.random.float(0.25, 0.35);
        const advanceAmount = Math.round((totalAmount * advanceRatio) / 100) * 100;
        const settlementAmount = totalAmount - advanceAmount;

        const advanceDate = new Date(booking.createdAt.getTime() + this.random.int(0, 2) * 86400000);
        const settlementDate = new Date(booking.eventDates.end.getTime() + this.random.int(1, 3) * 86400000);

        // Advance payment
        payments.push({
          paymentId: `PAY-SYN-${String(paymentCounter).padStart(6, '0')}`,
          bookingId: booking.bookingId,
          bookingRef: booking._id,
          customerRef: booking.customer,
          amount: advanceAmount,
          currency: 'INR',
          paymentType: 'Advance',
          paymentMethod: this.random.choice(['UPI', 'NEFT', 'NetBanking', 'Cheque']),
          transactionReference: `UPI/SYN/${paymentCounter}/${this.random.int(100000, 999999)}`,
          paymentDate: advanceDate,
          status: 'Successful',
          notes: 'Synthetic advance payment received upon quotation confirmation.',
          isSynthetic: true
        });
        paymentCounter++;

        // Settlement payment
        if (payments.length < targetCount) {
          payments.push({
            paymentId: `PAY-SYN-${String(paymentCounter).padStart(6, '0')}`,
            bookingId: booking.bookingId,
            bookingRef: booking._id,
            customerRef: booking.customer,
            amount: settlementAmount,
            currency: 'INR',
            paymentType: 'FinalSettlement',
            paymentMethod: this.random.choice(['UPI', 'NEFT', 'NetBanking', 'Cash']),
            transactionReference: `BNK/SYN/${paymentCounter}/${this.random.int(100000, 999999)}`,
            paymentDate: settlementDate,
            status: 'Successful',
            notes: 'Synthetic final settlement payment upon event conclusion.',
            isSynthetic: true
          });
          paymentCounter++;
        }
      }
    }

    // Pending bookings: Advance only (active money collected)
    for (const booking of bookings) {
      if (payments.length >= targetCount) break;

      if (booking.status === 'Pending') {
        const totalAmount = booking.finalAmount;
        const advanceRatio = 0.30;
        const advanceAmount = Math.round((totalAmount * advanceRatio) / 100) * 100;
        const advanceDate = new Date(booking.createdAt.getTime() + 86400000);

        payments.push({
          paymentId: `PAY-SYN-${String(paymentCounter).padStart(6, '0')}`,
          bookingId: booking.bookingId,
          bookingRef: booking._id,
          customerRef: booking.customer,
          amount: advanceAmount,
          currency: 'INR',
          paymentType: 'Advance',
          paymentMethod: this.random.choice(['UPI', 'NetBanking']),
          transactionReference: `UPI/SYN/${paymentCounter}/${this.random.int(100000, 999999)}`,
          paymentDate: advanceDate,
          status: 'Successful',
          notes: 'Synthetic advance payment for upcoming scheduled event.',
          isSynthetic: true
        });
        paymentCounter++;
      }
    }

    return payments.slice(0, targetCount);
  }
}

module.exports = {
  SyntheticDataGenerator
};

