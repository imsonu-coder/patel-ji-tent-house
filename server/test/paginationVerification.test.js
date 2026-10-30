const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parsePagination,
  parseListLimit,
  setPaginationHeaders,
  sendPaginatedList,
  sendBoundedList
} = require('../utils/httpValidation');

test('parsePagination parses valid page and pageSize query parameters', () => {
  const result = parsePagination({ page: '2', pageSize: '10' });
  assert.deepEqual(result, { page: 2, pageSize: 10, skip: 10 });
});

test('parsePagination defaults page to 1 and pageSize to defaultPageSize', () => {
  const result = parsePagination({}, { defaultPageSize: 12 });
  assert.deepEqual(result, { page: 1, pageSize: 12, skip: 0 });
});

test('parsePagination caps requested pageSize at maxPageSize', () => {
  const result = parsePagination({ page: '1', pageSize: '500' }, { maxPageSize: 100 });
  assert.deepEqual(result, { page: 1, pageSize: 100, skip: 0 });
});

test('parsePagination supports legacy limit query parameter', () => {
  const result = parsePagination({ page: '3', limit: '15' });
  assert.deepEqual(result, { page: 3, pageSize: 15, skip: 30 });
});

test('parsePagination rejects malformed page or pageSize inputs', () => {
  assert.equal(parsePagination({ page: '0' }), null);
  assert.equal(parsePagination({ page: '-1' }), null);
  assert.equal(parsePagination({ page: 'abc' }), null);
  assert.equal(parsePagination({ page: '1.5' }), null);
  assert.equal(parsePagination({ pageSize: '0' }), null);
  assert.equal(parsePagination({ pageSize: '-5' }), null);
  assert.equal(parsePagination({ pageSize: 'invalid' }), null);
});

test('setPaginationHeaders sets all standard pagination response headers accurately', () => {
  const headers = {};
  const mockRes = {
    set(name, value) {
      headers[name] = value;
      return this;
    }
  };

  setPaginationHeaders(mockRes, { page: 2, pageSize: 10, total: 35 });

  assert.equal(headers['X-Total-Count'], '35');
  assert.equal(headers['X-Page'], '2');
  assert.equal(headers['X-Page-Size'], '10');
  assert.equal(headers['X-Total-Pages'], '4');
  assert.equal(headers['X-Has-Next'], 'true');
  assert.equal(headers['X-Has-Previous'], 'true');
});

test('setPaginationHeaders handles empty lists and first page boundary', () => {
  const headers = {};
  const mockRes = {
    set(name, value) {
      headers[name] = value;
      return this;
    }
  };

  setPaginationHeaders(mockRes, { page: 1, pageSize: 20, total: 0 });

  assert.equal(headers['X-Total-Count'], '0');
  assert.equal(headers['X-Page'], '1');
  assert.equal(headers['X-Page-Size'], '20');
  assert.equal(headers['X-Total-Pages'], '0');
  assert.equal(headers['X-Has-Next'], 'false');
  assert.equal(headers['X-Has-Previous'], 'false');
});

test('sendPaginatedList returns array data and sets pagination headers', () => {
  const headers = {};
  let body = null;
  const mockRes = {
    set(name, value) {
      headers[name] = value;
      return this;
    },
    json(data) {
      body = data;
      return this;
    }
  };

  const items = [{ id: 1 }, { id: 2 }];
  sendPaginatedList(mockRes, items, { page: 1, pageSize: 10, skip: 0 }, 2);

  assert.deepEqual(body, items);
  assert.equal(headers['X-Total-Count'], '2');
  assert.equal(headers['X-Page'], '1');
});

test('backward-compatible parseListLimit and sendBoundedList remain fully operational', () => {
  assert.equal(parseListLimit(undefined), 500);
  assert.equal(parseListLimit('50'), 50);
  assert.equal(parseListLimit('9999'), 1000);
  assert.equal(parseListLimit('invalid'), null);

  const headers = {};
  let payload = null;
  const mockRes = {
    set(name, value) {
      headers[name] = value;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    }
  };

  sendBoundedList(mockRes, [1, 2, 3, 4], 2);
  assert.deepEqual(payload, [1, 2]);
  assert.equal(headers['X-Result-Limit'], '2');
  assert.equal(headers['X-Results-Truncated'], 'true');
});

