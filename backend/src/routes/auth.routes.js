import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { signupSchema, loginSchema, onboardingSchema } from '../schemas/auth.schema.js';
import { loginRateLimiter, signupRateLimiter } from '../middleware/rateLimiter.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/signup', signupRateLimiter, validate(signupSchema), authController.signup);
router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);

// Protected routes
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getCurrentUser);
router.get('/current-user', requireAuth, authController.getCurrentUser);
router.put('/onboarding', requireAuth, validate(onboardingSchema), authController.updateOnboarding);

export default router;
