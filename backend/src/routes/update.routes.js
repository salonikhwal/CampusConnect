import express from 'express';
import {
  getUpdates,
  createUpdate,
  getUpdateById,
  updateUpdate,
  deleteUpdate,
  saveItem,
  unsaveItem,
} from '../controllers/update.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { createUpdateSchema, updateUpdateSchema } from '../schemas/update.schema.js';
import { postRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// List updates with tabs, search, category filters, and saved status
router.get('/', getUpdates);

// Create new update item (admin required for isOfficial)
router.post('/', postRateLimiter, validate(createUpdateSchema), createUpdate);

// Get single update item
router.get('/:id', getUpdateById);

// Update item (author or admin only)
router.put('/:id', validate(updateUpdateSchema), updateUpdate);

// Delete item (author or admin only)
router.delete('/:id', deleteUpdate);

// Bookmark / Save an item
router.post('/:id/save', postRateLimiter, saveItem);

// Unsave / Remove bookmark
router.post('/:id/unsave', postRateLimiter, unsaveItem);
router.delete('/:id/save', postRateLimiter, unsaveItem);

export default router;
