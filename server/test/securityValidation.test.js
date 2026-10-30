const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authRoutes = require('../routes/authRoutes');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  escapeRegex,
  isObjectId,
  isPlainObject,
  parseListLimit,
  readNonNegativeNumber,
  readText,
  redactDiagnosticText,
  sendBoundedList,
  sendRouteError
} = require('../utils/httpValidation');

const originalJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'database-free-test-secret-at-least-32-bytes';
test.after(() => {
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});

test('shared HTTP validators reject malformed values and bound list sizes', () => {
  assert.equal(isPlainObject({ value: 1 }), true);
  assert.equal(isPlainObject([]), false);
  assert.equal(isObjectId('507f1f77bcf86cd799439011'), true);
  assert.equal(isObjectId({ toString: () => '507f1f77bcf86cd799439011' }), false);
  assert.equal(readText('  ok  ', { max: 2 }), 'ok');
  assert.equal(readText('   ', { min: 0 }), '');
  assert.equal(readNonNegativeNumber('12.5'), 12.5);
  assert.equal(readNonNegativeNumber(null), null);
  assert.equal(readNonNegativeNumber(-1), null);
  assert.equal(readNonNegativeNumber('1.5', { integer: true }), null);
  assert.equal(parseListLimit(undefined), 500);
  assert.equal(parseListLimit('9999'), 1000);
  assert.equal(parseListLimit('0'), null);
  assert.equal(parseListLimit('1.5'), null);
  assert.equal(escapeRegex('chair.*'), 'chair\\.\\*');
});

test('bounded list helper preserves array payloads and exposes truncation headers', () => {
  const headers = {};
  let payload;
  const response = {
    set(name, value) { headers[name] = value; return this; },
    json(value) { payload = value; return this; }
  };
  sendBoundedList(response, ['one', 'two', 'three'], 2);
  assert.deepEqual(payload, ['one', 'two']);
  assert.equal(headers['X-Result-Limit'], '2');
  assert.equal(headers['X-Results-Truncated'], 'true');
});

test('diagnostic redaction removes database URIs, bearer tokens, and secret assignments', () => {
  const output = redactDiagnosticText(
    'mongodb+srv://user:pass@example.invalid/db Bearer abc.def token=hidden'
  );
  assert.doesNotMatch(output, /user:pass|abc\.def|token=hidden/);
});

test('unexpected route errors return generic responses without leaking internal details', () => {
  const response = {
    req: { method: 'GET', path: '/test' },
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    sendRouteError(response, new Error('mongodb://user:password@database.invalid/app'), 'Request failed.');
  } finally {
    console.error = originalError;
  }
  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { message: 'Request failed.' });
});

test('registration validator enforces field allowlist, formats, and bcrypt byte limits', () => {
  const validate = authRoutes.validateRegistrationInput;
  assert.deepEqual(validate({
    name: 'Customer',
    phone: '+1 (555) 123-4567',
    email: 'CUSTOMER@example.com',
    password: 'valid-password',
    confirmPassword: 'valid-password'
  }), {
    name: 'Customer',
    phone: '+1 (555) 123-4567',
    email: 'customer@example.com',
    password: 'valid-password'
  });
  assert.throws(() => validate({
    name: 'Customer',
    phone: '5551234',
    email: 'customer@example.com',
    password: 'valid-password',
    confirmPassword: 'valid-password',
    role: 'admin'
  }), { statusCode: 400 });
  assert.throws(() => validate({
    name: 'Customer',
    phone: '5551234',
    email: 'customer@example.com',
    password: 'x'.repeat(73),
    confirmPassword: 'x'.repeat(73)
  }), { statusCode: 400 });
});

test('authentication rejects invalid algorithms and validates active persisted users without a database', async () => {
  const userId = '507f1f77bcf86cd799439011';
  const originalFindById = User.findById;
  const responseFor = () => ({
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  });
  const tokenFor = (algorithm = 'HS256') => jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { algorithm, expiresIn: '1m' }
  );

  try {
    const invalidResponse = responseFor();
    await authenticate(
      { headers: { authorization: `Bearer ${tokenFor('HS384')}` } },
      invalidResponse,
      (error) => { throw error || new Error('Invalid token reached next middleware.'); }
    );
    assert.equal(invalidResponse.statusCode, 401);

    User.findById = () => ({ select: async () => ({ _id: userId, role: 'customer', status: 'active' }) });
    const activeResponse = responseFor();
    let activeNextCalled = false;
    const activeRequest = { headers: { authorization: `Bearer ${tokenFor()}` } };
    await authenticate(activeRequest, activeResponse, () => { activeNextCalled = true; });
    assert.equal(activeNextCalled, true);
    assert.equal(activeRequest.user.role, 'customer');

    User.findById = () => ({ select: async () => ({ _id: userId, role: 'customer', status: 'inactive' }) });
    const inactiveResponse = responseFor();
    await authenticate(
      { headers: { authorization: `Bearer ${tokenFor()}` } },
      inactiveResponse,
      () => assert.fail('Inactive users must not reach route handlers.')
    );
    assert.equal(inactiveResponse.statusCode, 401);

    const databaseError = new Error('database unavailable');
    User.findById = () => ({ select: async () => { throw databaseError; } });
    let forwardedError;
    await authenticate(
      { headers: { authorization: `Bearer ${tokenFor()}` } },
      responseFor(),
      (error) => { forwardedError = error; }
    );
    assert.equal(forwardedError, databaseError);
  } finally {
    User.findById = originalFindById;
  }
});

test('admin authorization is based on the persisted user role', () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  let nextCalled = false;
  requireAdmin({ user: { role: 'customer' } }, response, () => { nextCalled = true; });
  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);

  requireAdmin({ user: { role: 'admin' } }, response, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});
