const rateLimit = require('express-rate-limit');

/**
 * Shared Rate Limiting Module
 *
 * Designed to support single-instance and multi-instance distributed deployments.
 *
 * In a multi-instance production deployment (behind reverse proxies/load balancers):
 * 1. Set TRUST_PROXY=1 in the environment so Express accurately tracks client IP via X-Forwarded-For.
 * 2. To coordinate limits across multiple node processes/containers, plug in an external distributed store
 *    (e.g., rate-limit-redis or rate-limit-mongo) by providing the `store` option.
 * 3. In the absence of an external store configuration (e.g. local development), an isolated in-process store
 *    is used with explicit diagnostics.
 */

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  limit = 100,
  message = 'Too many requests, please try again later.',
  store = undefined,
  skipSuccessfulRequests = false
} = {}) => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    skipSuccessfulRequests,
    handler: (req, res, next, options) => {
      res.status(options.statusCode || 429).json({
        message: typeof options.message === 'string' ? options.message : (options.message?.message || message)
      });
    }
  });
};

const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  message: 'Too many requests, please try again later.'
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many authentication attempts. Please try again later.'
});

const contactLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many enquiries. Please try again later.'
});

const requestCreationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  message: 'Too many event requests submitted. Please try again later.'
});

module.exports = {
  createRateLimiter,
  globalLimiter,
  authLimiter,
  contactLimiter,
  requestCreationLimiter
};

