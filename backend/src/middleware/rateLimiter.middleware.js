import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for student login attempts.
 * Prevents credential stuffing and brute-force attacks.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 50, // Limit each IP to 50 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    status: 'error',
    message: 'Too many login attempts from this IP address. Please try again after 15 minutes.',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Rate limiter for account registration.
 * Prevents automated account creation floods.
 */
export const signupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 50, // Limit each IP to 50 signups per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    status: 'error',
    message: 'Too many registration attempts from this IP address. Please try again later.',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Rate limiter for sending messages and Say Hi notes.
 * Prevents message spamming and denial-of-service on recipient inboxes.
 */
export const messageRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 60, // 60 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    status: 'error',
    message: 'Message rate limit exceeded. Please slow down your messaging rate.',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Rate limiter for creating community posts, comments, and updates.
 * Prevents feed spamming and flooding.
 */
export const postRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 30, // 30 posts/comments per minute
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    status: 'error',
    message: 'Posting rate limit exceeded. Please wait a moment before publishing again.',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Global rate limiter for API endpoints to prevent request flooding.
 */
export const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 500, // 500 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    status: 'error',
    message: 'Too many requests from this IP address. Please try again later.',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});
