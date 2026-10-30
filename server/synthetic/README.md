# Patel Ji Tent House — Synthetic Data Generation System

A reproducible, large-scale synthetic business data generator and validation suite designed for website load testing, financial analytics, demand forecasting experiments, and academic presentation for **Patel Ji Tent House**.

---

## 1. System Overview

- **Total Generated Volume:** ~15,328 relational records
- **Data Domains Covered:**
  - 1,500 Customer profiles
  - 300 Inventory rental catalogue items across 8 categories
  - 3,000 Event requests across Jaipur localities
  - 2,500 Commercial quotations with itemized line subtotals and discounts
  - 1,500 Bookings with authentic status distributions (Completed, Pending, Confirmed, Cancelled)
  - 2,000 Reconciled payment records (advances and final settlements)
  - 100 External vendor suppliers
  - 4,415 Inventory tracking records (supplier arrangements, reservations, and post-event return inspections)
- **Authenticity & Localization:**
  - Real Indian names and Rajasthan surnames.
  - Actual Jaipur localities, wedding corridors, and banquets (Mansarovar, Vaishali Nagar, Diggi Palace, etc.).
  - Clearly fictitious, non-dialable Indian phone numbers conforming to schema (`+91-000-000-XXXX` for customers, `+91-000-001-XXXX` for suppliers). In the Indian National Numbering Plan, Level '0' is completely unallocated to any telecom subscriber, guaranteeing these numbers cannot route, dial, or contact real people.
  - Realistic INR pricing, quantities, and realistic seasonality curves (peak winter weddings from Devuthani Ekadashi in November through February, summer peak in April–May, monsoon dip in July–August).
- **Mathematical Consistency:**
  - Every quotation total is strictly equal to:
    $$\text{finalTotal} = \sum(\text{subtotal}) + \text{decorationServices} + \text{transportation} + \text{additionalCharges} - \text{discount}$$
  - Every booking amount exactly matches the corresponding accepted quotation.
  - Payment records distinguish actual collected revenue from billed booking value. Cancelled bookings are never counted as collected revenue.

---

## 2. Strict Database Coexistence & Safety Architecture

1. **Permitted Target Database:**
   - The **ONLY** permitted database target is **`patel_tent_house`** (the project's existing MongoDB Atlas database).
   - Any URI pointing to unauthorized, system (`admin`, `local`, `config`), or other databases is strictly blocked by `databaseSafety.js`.
2. **Safe Document Coexistence (Zero Data Loss):**
   - Every synthetic document carries `isSynthetic: true` and an indexed, deterministic `syntheticId` (e.g. `CUST-SYN-00001`, `BOOK-SYN-000001`).
   - Mongoose schemas for all 10 target models define `isSynthetic` (`default: false`) and `syntheticId` (`sparse: true`), ensuring full backward compatibility for existing real documents.
   - Real documents retain `isSynthetic: false` / `syntheticId: undefined`.
3. **Pre-Import Unique-Index Collision Auditing:**
   - Before any record is written, the CLI performs an exhaustive collision check across unique indexes (`email`, `phone`, `requestId`, `bookingId`, `itemCode`).
   - If any real document collides with a synthetic identifier, the process halts immediately without writing.
4. **Category Preservation & ID Reuse:**
   - Existing real categories are queried by `slug` and their ObjectIds are reused for all synthetic items.
   - Real category documents are **never** modified or overwritten. Only genuinely missing categories are inserted.
5. **No Payment Collection Modification:**
   - Since no `Payment` Mongoose model exists in the application, payments are strictly exported to CSV (`payments_synthetic.csv`) for analytical modeling and are never inserted into MongoDB.
6. **No Destructive Operations & No Automated Rollbacks:**
   - No `dropDatabase()`, no `dropCollection()`, and no automated `deleteMany()` or cleanup scripts exist in this codebase.
   - Idempotent upserts match strictly on `{ syntheticId: doc.syntheticId }`.
7. **Read-Only Dry-Run Preview Mode:**
   - `--dry-run-import` connects in read-only mode, runs the collision audit, and reports planned inserts vs updates without modifying the database.

---

## 3. Quick Start & Execution

### A. Run Dry-Run (Offline In-Memory Validation & CSV Export)
Run this anytime without any database connection:
```powershell
node server/synthetic/cli.js --dry-run
```
This will:
1. Generate all ~15,328 records in memory deterministically using Mulberry32 PRNG (seed: 1337).
2. Execute full relational, chronological, mathematical, and uniqueness validations.
3. Compute financial reconciliation metrics.
4. Export all 10 CSV datasets into `server/synthetic/exports/`.
5. Display a detailed summary report in the console.

### B. Dry-Run Import Preview (Read-Only Collision & Plan Audit)
To inspect your Atlas database, check for collisions, and verify planned inserts without writing anything:
```powershell
node server/synthetic/cli.js --dry-run-import --confirm-target=patel_tent_house
```

### C. Live Coexistence Import (Explicit Two-Flag Confirmation)
When ready to import into your Atlas database after verifying your backup:
```powershell
node server/synthetic/cli.js --import --confirm-target=patel_tent_house --confirm-backup=yes
```
*(Both flags are required; omitting either halts execution immediately).*

---

## 4. Exported Datasets (CSV)

All CSV files are written to `server/synthetic/exports/`:

| Dataset File | Records | Primary Keys / Foreign Keys |
|---|---|---|
| `customers.csv` | 1,500 | `_id`, `syntheticId` |
| `inventory_items.csv` | 300 | `_id`, `itemCode`, `categorySlug` |
| `event_requests.csv` | 3,000 | `_id`, `requestId`, `user` -> `customers._id` |
| `quotations.csv` | 2,500 | `_id`, `request` -> `event_requests._id`, `customer` -> `customers._id` |
| `bookings.csv` | 1,500 | `_id`, `bookingId`, `request` -> `event_requests._id`, `quotation` -> `quotations._id` |
| `payments_synthetic.csv`| 2,000 | `paymentId`, `bookingId` -> `bookings.bookingId` (CSV only) |
| `suppliers.csv` | 100 | `_id`, `syntheticId` |
| `inventory_reservations.csv` | 2,500 | `_id`, `booking` -> `bookings._id`, `item` -> `inventory_items._id` |
| `supplier_arrangements.csv` | 915 | `_id`, `booking` -> `bookings._id`, `supplier` -> `suppliers._id` |
| `inventory_return_inspections.csv` | 1,000 | `_id`, `reservation` -> `inventory_reservations._id` |

*For complete column definitions and data types, see [`DATA_DICTIONARY.md`](./DATA_DICTIONARY.md).*

---

## 5. Analytics Filtering Support

The analytics service and routes support querying data by scope:
- `?scope=real` (default): queries only authentic business records (`{ isSynthetic: { $ne: true } }`).
- `?scope=synthetic`: queries only synthetic test records (`{ isSynthetic: true }`).
- `?scope=all` or `?scope=combined`: aggregates both real and synthetic datasets for load and capacity modeling.
- Synthetic payments are never recorded as actual revenue; booked value is derived exclusively from booking contracts.
