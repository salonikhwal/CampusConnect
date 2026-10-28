import { config } from '../config/env.js';
import prisma from '../config/prisma.js';
import { verifyToken } from '../utils/jwt.js';

export const requireAuth = async (req, res, next) => {
  try {
    // 1. Retrieve token from httpOnly cookie or fallback Bearer header
    let token = req.cookies?.[config.cookieName];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in to access this resource.',
      });
    }

    // 2. Verify JWT token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired session token. Please log in again.',
      });
    }

    // 3. Find active user in SQLite database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        rollNumber: true,
        batchYear: true,
        department: true,
        role: true,
        hostel: true,
        roomNo: true,
        labGroup: true,
        bio: true,
        avatarUrl: true,
        githubUrl: true,
        linkedinUrl: true,
        portfolioUrl: true,
        skills: true,
        interests: true,
        openTo: true,
        courses: true,
        isGuidanceProvider: true,
        guidanceTopics: true,
        guidanceBio: true,
        guidanceAvailability: true,
        isOnboarded: true,
        isAvailable: true,
        currentStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User account not found or has been removed.',
      });
    }

    // 4. Attach sanitized user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal authentication error.',
    });
  }
};

/**
 * Middleware that protects every route except signup and login (and health check)
 */
export const protectAllExceptPublicRoutes = (req, res, next) => {
  // Check against full originalUrl without query strings, and req.path
  const originalPath = req.originalUrl.split('?')[0];
  const relativePath = req.path;

  const publicPaths = [
    '/api/auth/signup',
    '/api/auth/login',
    '/api/health',
    '/health',
    '/auth/signup',
    '/auth/login',
  ];

  if (publicPaths.includes(originalPath) || publicPaths.includes(relativePath)) {
    return next();
  }

  // Enforce authentication on all other routes
  return requireAuth(req, res, next);
};
