const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PERMITTED_TARGET_DATABASE,
  DatabaseSafetyError,
  extractAndValidateDatabaseName
} = require('../synthetic/databaseSafety');
const { SyntheticDataGenerator } = require('../synthetic/generator');
const { SyntheticDataValidator } = require('../synthetic/validator');

test('database safety strictly permits only patel_tent_house', () => {
  // 1. Missing URI rejects
  assert.throws(() => extractAndValidateDatabaseName(''), DatabaseSafetyError);
  assert.throws(() => extractAndValidateDatabaseName(null), DatabaseSafetyError);

  // 2. System database rejects
  assert.throws(
    () => extractAndValidateDatabaseName('mongodb+srv://user:pass@cluster0.abc.mongodb.net/admin?retryWrites=true'),
    /is a forbidden system database/
  );

  // 3. Arbitrary or dev database rejects
  assert.throws(
    () => extractAndValidateDatabaseName('mongodb+srv://user:pass@cluster0.abc.mongodb.net/patel_tent_house_testing?retryWrites=true'),
    /Target database "patel_tent_house_testing" is not permitted/
  );

  // 4. Permitted target database passes
  const validated = extractAndValidateDatabaseName(
    'mongodb+srv://user:pass@cluster0.abc.mongodb.net/patel_tent_house?retryWrites=true&w=majority'
  );
  assert.equal(validated, PERMITTED_TARGET_DATABASE);
});

test('synthetic data generator is 100% deterministic with same seed', () => {
  const gen1 = new SyntheticDataGenerator(4242);
  const gen2 = new SyntheticDataGenerator(4242);

  const cats1 = gen1.generateCategories();
  const cats2 = gen2.generateCategories();
  assert.equal(cats1[0].name, cats2[0].name);

  const { customers: c1 } = gen1.generateUsers(10, 1);
  const { customers: c2 } = gen2.generateUsers(10, 1);
  assert.equal(c1[0].name, c2[0].name);
  assert.equal(c1[0].phone, c2[0].phone);
  assert.equal(c1[0].email, c2[0].email);
});

test('synthetic data generator output passes relational and mathematical validation', () => {
  const generator = new SyntheticDataGenerator(1337);
  // Generate sample dataset
  const data = generator.generateAll();
  const validator = new SyntheticDataValidator(data);
  const results = validator.validateAll();

  assert.equal(results.isValid, true);
  assert.equal(results.errors.length, 0);

  // Verify counts
  assert.equal(data.customers.length, 1500);
  assert.equal(data.items.length, 300);
  assert.equal(data.requests.length, 3000);
  assert.equal(data.quotations.length, 2500);
  assert.equal(data.bookings.length, 1500);
  assert.equal(data.payments.length, 2000);
  assert.equal(data.suppliers.length, 100);

  // Fictitious non-dialable phone validation
  for (const c of data.customers) {
    assert.match(c.phone, /^\+91-000-000-\d{4}$/);
    assert.ok(!/^\+91[6-9]/.test(c.phone), 'Must not use routable Indian mobile levels 6-9');
  }
  for (const s of data.suppliers) {
    assert.match(s.phone, /^\+91-000-001-\d{4}$/);
    assert.ok(!/^\+91[6-9]/.test(s.phone), 'Must not use routable Indian mobile levels 6-9');
  }

  // Financial reconciliation consistency
  assert.equal(results.metrics.totalBookedValue, results.metrics.acceptedQuotationValue);
  assert.ok(results.metrics.actualCollectedCash > 0);
  assert.ok(results.metrics.outstandingReceivables >= 0);
});

