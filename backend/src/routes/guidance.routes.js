import express from 'express';
import {
  getGuidanceStatus,
  optInGuidance,
  optOutGuidance,
  getGuidanceProviders,
  getGuidanceFaqs,
  getGuidanceTopics,
} from '../controllers/guidance.controller.js';

import { validate } from '../middleware/validate.middleware.js';
import { optInGuidanceSchema } from '../schemas/guidance.schema.js';
import { postRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// Guidance provider status and eligibility for current user
router.get('/status', getGuidanceStatus);

// Opt-in (3rd and 4th years only)
router.post('/opt-in', postRateLimiter, validate(optInGuidanceSchema), optInGuidance);

// Opt-out
router.post('/opt-out', postRateLimiter, optOutGuidance);

// List active guidance providers with topic and search filters
router.get('/providers', getGuidanceProviders);

// Curated "Questions students often ask"
router.get('/faqs', getGuidanceFaqs);

// Active guidance topics for filter chips
router.get('/topics', getGuidanceTopics);

export default router;
