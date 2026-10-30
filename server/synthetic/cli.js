#!/usr/bin/env node
/**
 * CLI Entrypoint for Patel Ji Tent House Synthetic Data Generation System
 *
 * Usage:
 *   # 1. Offline In-Memory Dry Run (Generates CSVs, 0 database contact)
 *   node server/synthetic/cli.js --dry-run
 *
 *   # 2. Read-Only Database Dry-Run Preview (Checks collisions, previews inserts/updates, 0 writes)
 *   node server/synthetic/cli.js --dry-run-import --confirm-target=patel_tent_house
 *
 *   # 3. Live Non-Destructive Database Import (Requires target & backup confirmation)
 *   node server/synthetic/cli.js --import --confirm-target=patel_tent_house --confirm-backup=yes
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { SyntheticDataGenerator } = require('./generator');
const { SyntheticDataValidator } = require('./validator');
const { SyntheticDataExporter } = require('./exporter');
const {
  PERMITTED_TARGET_DATABASE,
  validateSyntheticEnvironment,
  assertSafeActiveConnection
} = require('./databaseSafety');

// Models for safe idempotent coexistence import
const Category = require('../models/Category');
const Item = require('../models/Item');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const EventRequest = require('../models/EventRequest');
const Quotation = require('../models/Quotation');
const Booking = require('../models/Booking');
const SupplierArrangement = require('../models/SupplierArrangement');
const InventoryReservation = require('../models/InventoryReservation');
const InventoryReturnInspection = require('../models/InventoryReturnInspection');

/**
 * Scans the target database for any potential unique-index collisions between
 * the generated synthetic dataset and existing real (non-synthetic) documents.
 *
 * @param {object} data - Generated in-memory dataset
 * @returns {Promise<Array<{ entity: string, field: string, value: string, reason: string }>>}
 */
async function performCollisionCheck(data) {
  const collisions = [];

  // Helper to chunk arrays for MongoDB $in queries
  const chunkArray = (arr, size = 1000) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  // 1. Check User collisions (email, phone)
  const syntheticUsers = [...data.customers, ...data.admins];
  const emailSet = new Set(syntheticUsers.map((u) => u.email.toLowerCase()));
  const phoneSet = new Set(syntheticUsers.map((u) => u.phone));

  for (const chunk of chunkArray(Array.from(emailSet))) {
    const existing = await User.find({ email: { $in: chunk } })
      .select('email phone isSynthetic syntheticId')
      .lean();
    for (const doc of existing) {
      if (doc.isSynthetic !== true) {
        collisions.push({
          entity: 'User',
          field: 'email',
          value: doc.email,
          reason: 'Collides with existing real user email in database'
        });
      }
    }
  }

  for (const chunk of chunkArray(Array.from(phoneSet))) {
    const existing = await User.find({ phone: { $in: chunk } })
      .select('email phone isSynthetic syntheticId')
      .lean();
    for (const doc of existing) {
      if (doc.isSynthetic !== true) {
        collisions.push({
          entity: 'User',
          field: 'phone',
          value: doc.phone,
          reason: 'Collides with existing real user phone number in database'
        });
      }
    }
  }

  // 2. Check Supplier collisions (email, phone)
  const supplierEmailSet = new Set(data.suppliers.map((s) => s.email.toLowerCase()));
  const supplierPhoneSet = new Set(data.suppliers.map((s) => s.phone));

  for (const chunk of chunkArray(Array.from(supplierEmailSet))) {
    const existing = await Supplier.find({ email: { $in: chunk } })
      .select('email phone isSynthetic syntheticId')
      .lean();
    for (const doc of existing) {
      if (doc.isSynthetic !== true) {
        collisions.push({
          entity: 'Supplier',
          field: 'email',
          value: doc.email,
          reason: 'Collides with existing real supplier email in database'
        });
      }
    }
  }

  for (const chunk of chunkArray(Array.from(supplierPhoneSet))) {
    const existing = await Supplier.find({ phone: { $in: chunk } })
      .select('email phone isSynthetic syntheticId')
      .lean();
    for (const doc of existing) {
      if (doc.isSynthetic !== true) {
        collisions.push({
          entity: 'Supplier',
          field: 'phone',
          value: doc.phone,
          reason: 'Collides with existing real supplier phone number in database'
        });
      }
    }
  }

  // 3. Check EventRequest collisions (requestId)
  const requestIds = data.requests.map((r) => r.requestId);
  for (const chunk of chunkArray(requestIds)) {
    const existing = await EventRequest.find({ requestId: { $in: chunk } })
      .select('requestId isSynthetic syntheticId')
      .lean();
    for (const doc of existing) {
      if (doc.isSynthetic !== true) {
        collisions.push({
          entity: 'EventRequest',
          field: 'requestId',
          value: doc.requestId,
          reason: 'Collides with existing real event request ID in database'
        });
      }
    }
  }

  // 4. Check Booking collisions (bookingId)
  const bookingIds = data.bookings.map((b) => b.bookingId);
  for (const chunk of chunkArray(bookingIds)) {
    const existing = await Booking.find({ bookingId: { $in: chunk } })
      .select('bookingId isSynthetic syntheticId')
      .lean();
    for (const doc of existing) {
      if (doc.isSynthetic !== true) {
        collisions.push({
          entity: 'Booking',
          field: 'bookingId',
          value: doc.bookingId,
          reason: 'Collides with existing real booking ID in database'
        });
      }
    }
  }

  // 5. Check Item collisions (itemCode)
  const itemCodes = data.items.map((i) => i.itemCode);
  for (const chunk of chunkArray(itemCodes)) {
    const existing = await Item.find({ itemCode: { $in: chunk } })
      .select('itemCode isSynthetic syntheticId')
      .lean();
    for (const doc of existing) {
      if (doc.isSynthetic !== true) {
        collisions.push({
          entity: 'Item',
          field: 'itemCode',
          value: doc.itemCode,
          reason: 'Collides with existing real item code in database'
        });
      }
    }
  }

  return collisions;
}

/**
 * Reconciles categories against the database:
 * - Queries existing categories by slug.
 * - Reuses matching category _ids for all synthetic items.
 * - Preserves existing real categories untouched (NO modifications or overwrites).
 * - Identifies missing categories that need to be inserted.
 *
 * @param {object} data
 * @returns {Promise<{ existingCategories: Array, reusedCategories: Array, categoriesToInsert: Array }>}
 */
async function reconcileCategories(data) {
  const existingCategories = await Category.find({}).lean();
  const existingBySlug = new Map(existingCategories.map((c) => [c.slug.toLowerCase(), c]));
  const existingByName = new Map(existingCategories.map((c) => [c.name.toLowerCase().trim(), c]));

  const reusedCategories = [];
  const categoriesToInsert = [];

  for (const cat of data.categories) {
    const existing = existingBySlug.get(cat.slug.toLowerCase()) || existingByName.get(cat.name.toLowerCase().trim());
    if (existing) {
      reusedCategories.push({
        slug: cat.slug,
        name: existing.name,
        existingId: existing._id,
        isSynthetic: Boolean(existing.isSynthetic)
      });
      // Remap synthetic items referencing this category slug
      for (const item of data.items) {
        if (item.categorySlug === cat.slug || item.category === cat._id) {
          item.category = existing._id;
        }
      }
    } else {
      categoriesToInsert.push(cat);
    }
  }

  return { existingCategories, reusedCategories, categoriesToInsert };
}

/**
 * Performs idempotent batch upsert matching strictly on syntheticId.
 * Never modifies or matches documents where syntheticId is undefined (i.e. real documents).
 *
 * @param {import('mongoose').Model} Model
 * @param {Array<object>} documents
 * @param {number} batchSize
 */
async function upsertSyntheticBatch(Model, documents, batchSize = 500) {
  let upsertedCount = 0;
  let modifiedCount = 0;

  for (let i = 0; i < documents.length; i += batchSize) {
    const chunk = documents.slice(i, i + batchSize);
    const ops = chunk.map((doc) => ({
      updateOne: {
        filter: { syntheticId: doc.syntheticId },
        update: { $set: doc },
        upsert: true
      }
    }));
    const res = await Model.bulkWrite(ops, { ordered: false });
    upsertedCount += (res.upsertedCount || 0);
    modifiedCount += (res.modifiedCount || 0);
  }

  return { upsertedCount, modifiedCount };
}

async function runCLI() {
  const args = process.argv.slice(2);
  const isImportMode = args.includes('--import');
  const isDryRunImport = args.includes('--dry-run-import');
  const isDryRun = !isImportMode && !isDryRunImport;

  const confirmTargetArg = args.find((a) => a.startsWith('--confirm-target='));
  const confirmedTarget = confirmTargetArg ? confirmTargetArg.split('=')[1] : null;
  const confirmedBackup = args.includes('--confirm-backup=yes');

  console.log('========================================================================');
  console.log('       PATEL JI TENT HOUSE — SYNTHETIC DATA GENERATION SYSTEM          ');
  console.log('========================================================================');
  let modeLabel = 'OFFLINE DRY-RUN (IN-MEMORY & CSV ONLY)';
  if (isImportMode) modeLabel = 'LIVE DATABASE COEXISTENCE IMPORT';
  if (isDryRunImport) modeLabel = 'DATABASE DRY-RUN PREVIEW (READ-ONLY)';
  console.log(`Execution Mode: ${modeLabel}`);
  console.log(`Target Database: ${PERMITTED_TARGET_DATABASE}`);
  console.log('------------------------------------------------------------------------\n');

  // Step 1: Generate Data In-Memory Deterministically
  const generator = new SyntheticDataGenerator(1337);
  const data = generator.generateAll();

  // Step 2: Validate Data Relational Integrity
  const validator = new SyntheticDataValidator(data);
  const validationResults = validator.validateAll();

  // Step 3: Export Datasets to CSV
  const exportDir = path.resolve(__dirname, 'exports');
  const exporter = new SyntheticDataExporter(data, exportDir);
  const exportedFiles = exporter.exportAll();

  // Format INR Currency
  const formatInr = (num) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);

  // Step 4: Print Comprehensive Report
  console.log('\n========================================================================');
  console.log('                       SYNTHETIC DATASET SUMMARY                        ');
  console.log('========================================================================');
  console.table([
    { Entity: 'Customer Profiles', Model: 'User (customer)', Count: data.customers.length },
    { Entity: 'Staff / Admin Users', Model: 'User (admin)', Count: data.admins.length },
    { Entity: 'Item Categories', Model: 'Category', Count: data.categories.length },
    { Entity: 'Inventory Items', Model: 'Item', Count: data.items.length },
    { Entity: 'External Suppliers', Model: 'Supplier', Count: data.suppliers.length },
    { Entity: 'Event Requests', Model: 'EventRequest', Count: data.requests.length },
    { Entity: 'Quotations', Model: 'Quotation', Count: data.quotations.length },
    { Entity: 'Bookings', Model: 'Booking', Count: data.bookings.length },
    { Entity: 'Supplier Commitments', Model: 'SupplierArrangement', Count: data.supplierArrangements.length },
    { Entity: 'Inventory Reservations', Model: 'InventoryReservation', Count: data.inventoryReservations.length },
    { Entity: 'Return Inspections', Model: 'InventoryReturnInspection', Count: data.inventoryReturnInspections.length },
    { Entity: 'Payments (Analytical CSV Only)', Model: 'payments_synthetic.csv', Count: data.payments.length },
    { Entity: '--- TOTAL RECORDS ---', Model: 'All Datasets', Count: data.summary.totalRecords }
  ]);

  console.log('\n------------------------------------------------------------------------');
  console.log('                    FINANCIAL & REVENUE RECONCILIATION                  ');
  console.log('------------------------------------------------------------------------');
  console.table([
    { Metric: 'Total Quoted Value (All 2,500 Quotes)', Amount: formatInr(validationResults.metrics.totalQuotedValue) },
    { Metric: 'Accepted Quotation Value (1,500 Quotes)', Amount: formatInr(validationResults.metrics.acceptedQuotationValue) },
    { Metric: 'Total Booked Value (All 1,500 Bookings)', Amount: formatInr(validationResults.metrics.totalBookedValue) },
    { Metric: '  - Completed Bookings Value (950)', Amount: formatInr(validationResults.metrics.completedBookedValue) },
    { Metric: '  - Pending / Active Bookings Value (350)', Amount: formatInr(validationResults.metrics.pendingBookedValue) },
    { Metric: '  - Confirmed Legacy Bookings Value (100)', Amount: formatInr(validationResults.metrics.confirmedBookedValue) },
    { Metric: '  - Cancelled Bookings Segregated Value (100)', Amount: formatInr(validationResults.metrics.cancelledBookedValue) },
    { Metric: 'Actual Cash Collected (2,000 Payment Records)', Amount: formatInr(validationResults.metrics.actualCollectedCash) },
    { Metric: '  - Advance Deposits Collected', Amount: formatInr(validationResults.metrics.advanceCashCollected) },
    { Metric: '  - Final Settlements Collected', Amount: formatInr(validationResults.metrics.settlementCashCollected) },
    { Metric: 'Outstanding Receivables (Active Unpaid Balance)', Amount: formatInr(validationResults.metrics.outstandingReceivables) }
  ]);

  console.log('\n------------------------------------------------------------------------');
  console.log('                        CSV EXPORT SUMMARY                              ');
  console.log('------------------------------------------------------------------------');
  console.table(exportedFiles.map((f) => ({ 'Dataset File': f.name, Records: f.rows, 'Destination Path': f.path })));

  if (!validationResults.isValid) {
    console.error('\n[FATAL] Validation failed with errors:');
    validationResults.errors.forEach((err) => console.error(` - ${err}`));
    process.exit(1);
  }

  // Handle Dry-Run Import Preview OR Live Import
  if (isDryRunImport || isImportMode) {
    console.log('\n========================================================================');
    console.log('                   DATABASE COEXISTENCE & SAFETY AUDIT                  ');
    console.log('========================================================================');

    // Requirement: Confirm Target Database Name
    if (confirmedTarget !== PERMITTED_TARGET_DATABASE) {
      console.error(`\n[SAFETY ERROR] Target confirmation failed! You must explicitly provide:`);
      console.error(`  --confirm-target=${PERMITTED_TARGET_DATABASE}`);
      console.error(`Received: ${confirmedTarget || 'None'}`);
      process.exit(1);
    }

    // Requirement: Confirm Backup Before Live Import
    if (isImportMode && !confirmedBackup) {
      console.error(`\n[SAFETY ERROR] Backup confirmation missing! Live import requires:`);
      console.error(`  --confirm-backup=yes`);
      console.error(`Confirming you have verified a fresh backup/mongodump of ${PERMITTED_TARGET_DATABASE}.`);
      process.exit(1);
    }

    const { uri, databaseName } = validateSyntheticEnvironment();
    console.log(`Target Database Validated: ${databaseName}`);
    console.log(`Connecting to MongoDB (${isDryRunImport ? 'READ-ONLY INSPECTION' : 'IMPORT'})...`);

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    assertSafeActiveConnection(mongoose);
    console.log(`Connected securely to "${databaseName}". Running pre-import collision audit...\n`);

    // 1. Collision Check against real database records
    const collisions = await performCollisionCheck(data);
    if (collisions.length > 0) {
      console.error('\n[FATAL COLLISION DETECTED] Import aborted! Found collisions with existing real records:');
      console.table(collisions);
      await mongoose.disconnect();
      process.exit(1);
    }
    console.log('[AUDIT CHECK 1] Unique Index Collision Audit: PASSED (0 collisions detected with real records).');

    // 2. Category Reconcile & Reuse Check
    const { existingCategories, reusedCategories, categoriesToInsert } = await reconcileCategories(data);
    console.log(`[AUDIT CHECK 2] Category Preservation Audit:`);
    console.log(`  - Existing database categories: ${existingCategories.length}`);
    console.log(`  - Reused existing category IDs: ${reusedCategories.length} (no updates to real records)`);
    console.log(`  - Missing categories to insert: ${categoriesToInsert.length}`);

    // If Dry-Run Import: Check planned operations without writing
    if (isDryRunImport) {
      console.log('\n------------------------------------------------------------------------');
      console.log('                 DRY-RUN IMPORT PREVIEW (0 WRITES PERFORMED)            ');
      console.log('------------------------------------------------------------------------');

      const previewCollections = [
        { name: 'Users (Customers & Admins)', Model: User, docs: [...data.customers, ...data.admins] },
        { name: 'Categories (New Only)', Model: Category, docs: categoriesToInsert },
        { name: 'Inventory Items', Model: Item, docs: data.items },
        { name: 'External Suppliers', Model: Supplier, docs: data.suppliers },
        { name: 'Event Requests', Model: EventRequest, docs: data.requests },
        { name: 'Quotations', Model: Quotation, docs: data.quotations },
        { name: 'Bookings', Model: Booking, docs: data.bookings },
        { name: 'Supplier Arrangements', Model: SupplierArrangement, docs: data.supplierArrangements },
        { name: 'Inventory Reservations', Model: InventoryReservation, docs: data.inventoryReservations },
        { name: 'Return Inspections', Model: InventoryReturnInspection, docs: data.inventoryReturnInspections }
      ];

      const previewResults = [];
      for (const col of previewCollections) {
        const syntheticIds = col.docs.map((d) => d.syntheticId).filter(Boolean);
        const existingCount = syntheticIds.length > 0
          ? await col.Model.countDocuments({ syntheticId: { $in: syntheticIds } })
          : 0;
        const realCount = await col.Model.countDocuments({ isSynthetic: { $ne: true } });

        previewResults.push({
          Entity: col.name,
          'Real Records in DB': realCount,
          'Synthetic To Import': col.docs.length,
          'Planned Inserts': col.docs.length - existingCount,
          'Planned Updates': existingCount
        });
      }

      console.table(previewResults);
      console.log('\n[NOTE] Payments are strictly kept in CSV (payments_synthetic.csv). No Payment collection will be touched.');
      console.log('[SUCCESS] Dry-run preview completed successfully with ZERO modifications to the database.');
      await mongoose.disconnect();
      return;
    }

    // Live Import Mode
    console.log('\n------------------------------------------------------------------------');
    console.log('             EXECUTING SAFE IDEMPOTENT COEXISTENCE IMPORT               ');
    console.log('------------------------------------------------------------------------');

    const importResults = [];

    // Categories: Insert only missing categories
    if (categoriesToInsert.length > 0) {
      console.log(`Inserting ${categoriesToInsert.length} new synthetic categories...`);
      const catRes = await upsertSyntheticBatch(Category, categoriesToInsert);
      importResults.push({ Entity: 'Categories (New)', ...catRes });
    } else {
      console.log('All categories already exist in database. Reused existing IDs; 0 category writes.');
      importResults.push({ Entity: 'Categories', upsertedCount: 0, modifiedCount: 0 });
    }

    // Upsert items
    console.log('Upserting Inventory Items...');
    const itemRes = await upsertSyntheticBatch(Item, data.items);
    importResults.push({ Entity: 'Inventory Items', ...itemRes });

    // Upsert users
    console.log('Upserting Users (Customers & Admins)...');
    const userRes = await upsertSyntheticBatch(User, [...data.customers, ...data.admins]);
    importResults.push({ Entity: 'Users', ...userRes });

    // Upsert suppliers
    console.log('Upserting Suppliers...');
    const suppRes = await upsertSyntheticBatch(Supplier, data.suppliers);
    importResults.push({ Entity: 'Suppliers', ...suppRes });

    // Upsert requests
    console.log('Upserting Event Requests...');
    const reqRes = await upsertSyntheticBatch(EventRequest, data.requests);
    importResults.push({ Entity: 'Event Requests', ...reqRes });

    // Upsert quotations
    console.log('Upserting Quotations...');
    const quotRes = await upsertSyntheticBatch(Quotation, data.quotations);
    importResults.push({ Entity: 'Quotations', ...quotRes });

    // Upsert bookings
    console.log('Upserting Bookings...');
    const bookRes = await upsertSyntheticBatch(Booking, data.bookings);
    importResults.push({ Entity: 'Bookings', ...bookRes });

    // Upsert supplier arrangements
    console.log('Upserting Supplier Arrangements...');
    const saRes = await upsertSyntheticBatch(SupplierArrangement, data.supplierArrangements);
    importResults.push({ Entity: 'Supplier Arrangements', ...saRes });

    // Upsert inventory reservations
    console.log('Upserting Inventory Reservations...');
    const irRes = await upsertSyntheticBatch(InventoryReservation, data.inventoryReservations);
    importResults.push({ Entity: 'Inventory Reservations', ...irRes });

    // Upsert return inspections
    console.log('Upserting Return Inspections...');
    const inspRes = await upsertSyntheticBatch(InventoryReturnInspection, data.inventoryReturnInspections);
    importResults.push({ Entity: 'Return Inspections', ...inspRes });

    console.log('\n========================================================================');
    console.log('                   IMPORT EXECUTION RESULTS SUMMARY                     ');
    console.log('========================================================================');
    console.table(importResults);
    console.log('\n[SUCCESS] Idempotent synthetic data coexistence import into "' + databaseName + '" completed safely!');
    await mongoose.disconnect();
  } else {
    console.log('\n[NOTE] Offline dry-run completed. No database connections were opened.');
    console.log(`To preview import safely without writes:`);
    console.log(`  node server/synthetic/cli.js --dry-run-import --confirm-target=${PERMITTED_TARGET_DATABASE}`);
    console.log(`To perform live coexistence import into Atlas:`);
    console.log(`  node server/synthetic/cli.js --import --confirm-target=${PERMITTED_TARGET_DATABASE} --confirm-backup=yes\n`);
  }
}

if (require.main === module) {
  runCLI().catch((err) => {
    console.error(`\n[FATAL ERROR] Execution failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  runCLI,
  performCollisionCheck,
  reconcileCategories,
  upsertSyntheticBatch
};
