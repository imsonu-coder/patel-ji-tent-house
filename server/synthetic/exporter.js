/**
 * Synthetic Data CSV Exporter for Patel Ji Tent House
 * Generates clean, RFC-compliant CSV files optimized for Pandas, Python, Jupyter,
 * Power BI, Tableau, and academic data analysis.
 */

const fs = require('fs');
const path = require('path');

function escapeCsv(val) {
  if (val == null) return '';
  if (val instanceof Date) return val.toISOString();
  if (Array.isArray(val)) {
    return `"${val.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(';').replace(/"/g, '""')}"`;
  }
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function writeCsvFile(filePath, headers, rows) {
  const headerLine = headers.join(',');
  const rowLines = rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(','));
  const content = [headerLine, ...rowLines].join('\n');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

class SyntheticDataExporter {
  constructor(data, exportDir) {
    this.data = data;
    this.exportDir = exportDir || path.resolve(__dirname, 'exports');
  }

  exportAll() {
    console.log(`[EXPORTER] Exporting synthetic datasets to: ${this.exportDir}...`);

    const exportedFiles = [];

    // 1. Customers
    const custHeaders = ['syntheticId', '_id', 'name', 'phone', 'email', 'role', 'status', 'createdAt'];
    const custPath = path.join(this.exportDir, 'customers.csv');
    writeCsvFile(custPath, custHeaders, this.data.customers);
    exportedFiles.push({ name: 'customers.csv', path: custPath, rows: this.data.customers.length });

    // 2. Inventory Items
    const itemHeaders = ['syntheticId', '_id', 'itemCode', 'name', 'categorySlug', 'categoryName', 'basePrice', 'priceUnit', 'ownStock', 'status'];
    const itemPath = path.join(this.exportDir, 'inventory_items.csv');
    writeCsvFile(itemPath, itemHeaders, this.data.items);
    exportedFiles.push({ name: 'inventory_items.csv', path: itemPath, rows: this.data.items.length });

    // 3. Event Requests
    const reqHeaders = ['syntheticId', '_id', 'requestId', 'user', 'eventType', 'startDate', 'endDate', 'location', 'guestCount', 'status', 'estimatedAmount', 'createdAt'];
    const reqPath = path.join(this.exportDir, 'event_requests.csv');
    writeCsvFile(reqPath, reqHeaders, this.data.requests);
    exportedFiles.push({ name: 'event_requests.csv', path: reqPath, rows: this.data.requests.length });

    // 4. Quotations
    const quotHeaders = ['syntheticId', '_id', 'request', 'customer', 'eventType', 'finalTotal', 'decorationServices', 'transportation', 'discount', 'additionalCharges', 'status', 'validityDate', 'createdAt'];
    const quotPath = path.join(this.exportDir, 'quotations.csv');
    writeCsvFile(quotPath, quotHeaders, this.data.quotations);
    exportedFiles.push({ name: 'quotations.csv', path: quotPath, rows: this.data.quotations.length });

    // 5. Bookings
    const bookHeaders = ['syntheticId', '_id', 'bookingId', 'customer', 'request', 'quotation', 'location', 'finalAmount', 'inventoryVerificationStatus', 'status', 'createdAt'];
    const bookRows = this.data.bookings.map((b) => ({
      ...b,
      startDate: b.eventDates?.start,
      endDate: b.eventDates?.end
    }));
    const bookPath = path.join(this.exportDir, 'bookings.csv');
    writeCsvFile(bookPath, bookHeaders, bookRows);
    exportedFiles.push({ name: 'bookings.csv', path: bookPath, rows: this.data.bookings.length });

    // 6. Payments (reconciled financial dataset)
    const payHeaders = ['paymentId', 'bookingId', 'bookingRef', 'customerRef', 'amount', 'currency', 'paymentType', 'paymentMethod', 'transactionReference', 'paymentDate', 'status'];
    const payPath = path.join(this.exportDir, 'payments_synthetic.csv');
    writeCsvFile(payPath, payHeaders, this.data.payments);
    exportedFiles.push({ name: 'payments_synthetic.csv', path: payPath, rows: this.data.payments.length });

    // 7. Suppliers
    const suppHeaders = ['syntheticId', '_id', 'name', 'phone', 'email', 'address', 'categories', 'status', 'createdAt'];
    const suppPath = path.join(this.exportDir, 'suppliers.csv');
    writeCsvFile(suppPath, suppHeaders, this.data.suppliers);
    exportedFiles.push({ name: 'suppliers.csv', path: suppPath, rows: this.data.suppliers.length });

    // 8. Inventory Reservations
    const resHeaders = ['syntheticId', '_id', 'booking', 'item', 'quantity', 'source', 'allocationIdempotencyKey', 'status', 'verificationStatus', 'createdAt'];
    const resPath = path.join(this.exportDir, 'inventory_reservations.csv');
    writeCsvFile(resPath, resHeaders, this.data.inventoryReservations);
    exportedFiles.push({ name: 'inventory_reservations.csv', path: resPath, rows: this.data.inventoryReservations.length });

    // 9. Supplier Arrangements
    const arrHeaders = ['syntheticId', '_id', 'request', 'supplier', 'booking', 'item', 'itemName', 'quantity', 'confirmedQuantity', 'supplierCommitmentReference', 'supplyStatus', 'allocationStatus', 'status', 'createdAt'];
    const arrPath = path.join(this.exportDir, 'supplier_arrangements.csv');
    writeCsvFile(arrPath, arrHeaders, this.data.supplierArrangements);
    exportedFiles.push({ name: 'supplier_arrangements.csv', path: arrPath, rows: this.data.supplierArrangements.length });

    // 10. Inventory Return Inspections
    const inspHeaders = ['syntheticId', '_id', 'booking', 'reservation', 'item', 'returnedQuantity', 'inspectionOutcome', 'releaseStatus', 'releasedQuantity', 'releaseIdempotencyKey', 'inspectedAt'];
    const inspPath = path.join(this.exportDir, 'inventory_return_inspections.csv');
    writeCsvFile(inspPath, inspHeaders, this.data.inventoryReturnInspections);
    exportedFiles.push({ name: 'inventory_return_inspections.csv', path: inspPath, rows: this.data.inventoryReturnInspections.length });

    console.log(`[EXPORTER] All 10 CSV datasets exported successfully.`);
    return exportedFiles;
  }
}

module.exports = {
  SyntheticDataExporter,
  writeCsvFile
};

