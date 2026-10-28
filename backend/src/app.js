import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { protectAllExceptPublicRoutes } from './middleware/auth.middleware.js';
import { securityHeaders } from './middleware/securityHeaders.middleware.js';
import { globalApiLimiter } from './middleware/rateLimiter.middleware.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import messageRoutes from './routes/message.routes.js';
import groupRoutes from './routes/group.routes.js';
import postRoutes from './routes/post.routes.js';
import updateRoutes from './routes/update.routes.js';
import guidanceRoutes from './routes/guidance.routes.js';
import searchRoutes from './routes/search.routes.js';

const app = express();

// Trust proxy for rate-limiting behind local/cloud proxies
app.set('trust proxy', 1);

// Standard OWASP security headers
app.use(securityHeaders);

// CORS configuration supporting credentials (cookies)
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5001',
  'http://127.0.0.1:5001',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (!config.isProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS security policy. Origin not permitted.'), false);
    },
    credentials: true,
  })
);

// Global rate limiter on all API routes
app.use('/api', globalApiLimiter);

// Body and Cookie parsers with body size limits to prevent DoS
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Public health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'CampusConnect API',
    allowedDomain: `@${config.allowedEmailDomain}`,
    timestamp: new Date().toISOString(),
  });
});

// Enforce auth middleware on all API routes except signup, login, and health
app.use('/api', protectAllExceptPublicRoutes);

// Mount auth routes
app.use('/api/auth', authRoutes);

// Mount user profile routes
app.use('/api/users', userRoutes);

// Mount messaging & Say Hi routes
app.use('/api/messages', messageRoutes);

// Mount campus groups & workspace routes
app.use('/api/groups', groupRoutes);

// Mount community posts & discussion routes
app.use('/api/posts', postRoutes);

// Mount campus updates & opportunities routes
app.use('/api/updates', updateRoutes);
app.use('/api/opportunities', updateRoutes);

// Mount seniors & guidance routes
app.use('/api/guidance', guidanceRoutes);
app.use('/api/seniors', guidanceRoutes);

// Mount global omni-search routes
app.use('/api/search', searchRoutes);

// Sample protected test endpoint to verify non-auth routes are automatically protected
app.get('/api/protected-ping', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: `Hello ${req.user.name} (${req.user.rollNumber})! You have accessed a protected campus endpoint.`,
    user: req.user,
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Endpoint ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
});

export default app;
