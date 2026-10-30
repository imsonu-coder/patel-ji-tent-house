const isPlainObject = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

const isObjectId = (value) => (
  typeof value === 'string'
  && /^[a-f\d]{24}$/i.test(value)
);

const readText = (value, { min = 1, max, trim = true } = {}) => {
  if (typeof value !== 'string') return null;
  const text = trim ? value.trim() : value;
  if (text.length < min || (max !== undefined && text.length > max)) return null;
  return text;
};

const readNonNegativeNumber = (value, { integer = false } = {}) => {
  if (
    (typeof value !== 'number' && typeof value !== 'string')
    || (typeof value === 'string' && value.trim() === '')
  ) {
    return null;
  }
  const number = Number(value);
  if (
    !Number.isFinite(number)
    || number > Number.MAX_SAFE_INTEGER
    || number < 0
    || (integer && !Number.isSafeInteger(number))
  ) {
    return null;
  }
  return number;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sendRouteError = (res, error, fallbackMessage) => {
  const statusCode = Number.isInteger(error?.statusCode)
    && error.statusCode >= 400
    && error.statusCode < 500
    ? error.statusCode
    : error?.code === 11000
      ? 409
      : error?.name === 'ValidationError' || error?.name === 'CastError'
        ? 400
        : 500;
  const message = statusCode === 500
    ? fallbackMessage
    : error?.code === 11000
      ? 'A record with the provided unique values already exists.'
      : ['ValidationError', 'CastError'].includes(error?.name)
        ? 'Submitted data is invalid.'
        : error.message;

  if (statusCode === 500) {
    const identity = `[${res.req?.method || 'HTTP'} ${res.req?.path || ''}] ${error?.name || 'Error'}${error?.code ? ` (${error.code})` : ''}`;
    if (process.env.NODE_ENV === 'production') {
      console.error(identity);
    } else {
      console.error(identity, redactDiagnosticText(error?.stack || error?.message || ''));
    }
  }
  return res.status(statusCode).json({ message });
};

const redactDiagnosticText = (value) => String(value)
  .replace(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi, '[redacted database URI]')
  .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [redacted]')
  .replace(/(password|passwd|secret|token)\s*[:=]\s*["']?[^,\s"'`]+/gi, '$1=[redacted]');

const parseListLimit = (value, { defaultLimit = 500, maxLimit = 1000 } = {}) => {
  if (value === undefined) return defaultLimit;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return null;
  return Math.min(parsed, maxLimit);
};

const sendBoundedList = (res, results, limit) => {
  const isTruncated = Array.isArray(results) && results.length > limit;
  const payload = isTruncated ? results.slice(0, limit) : results;
  res.set('X-Result-Limit', String(limit));
  res.set('X-Results-Truncated', String(isTruncated));
  return res.json(payload);
};

const parsePagination = (query, { defaultPageSize = 20, maxPageSize = 100 } = {}) => {
  const rawPage = query.page;
  const rawPageSize = query.pageSize ?? query.limit;
  if (
    (rawPage !== undefined && (typeof rawPage !== 'string' || !/^\d+$/.test(rawPage)))
    || (rawPageSize !== undefined && (typeof rawPageSize !== 'string' || !/^\d+$/.test(rawPageSize)))
  ) {
    return null;
  }
  const page = rawPage === undefined ? 1 : Number(rawPage);
  const requestedSize = rawPageSize === undefined ? defaultPageSize : Number(rawPageSize);
  if (
    !Number.isSafeInteger(page)
    || page < 1
    || !Number.isSafeInteger(requestedSize)
    || requestedSize < 1
  ) {
    return null;
  }
  const pageSize = Math.min(requestedSize, maxPageSize);
  const skip = (page - 1) * pageSize;
  if (!Number.isSafeInteger(skip)) return null;
  return { page, pageSize, skip };
};

const setPaginationHeaders = (res, { page, pageSize, total }) => {
  const totalPages = Math.ceil(total / pageSize);
  res.set('X-Total-Count', String(total));
  res.set('X-Page', String(page));
  res.set('X-Page-Size', String(pageSize));
  res.set('X-Total-Pages', String(totalPages));
  res.set('X-Has-Next', String(page < totalPages));
  res.set('X-Has-Previous', String(page > 1 && total > 0));
};

const sendPaginatedList = (res, results, pagination, total) => {
  setPaginationHeaders(res, { ...pagination, total });
  return res.json(results);
};

module.exports = {
  escapeRegex,
  isObjectId,
  isPlainObject,
  parsePagination,
  readNonNegativeNumber,
  readText,
  redactDiagnosticText,
  parseListLimit,
  sendBoundedList,
  sendPaginatedList,
  setPaginationHeaders,
  sendRouteError
};
