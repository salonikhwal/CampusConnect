import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateProfileSchema, createPostSchema } from '../schemas/user.schema.js';
import { postRateLimiter } from '../middleware/rateLimiter.middleware.js';

import { getDiscoverPeers } from '../controllers/discover.controller.js';

const router = Router();

// Discover classmates directory with rich filters & similar interests
router.get('/discover', getDiscoverPeers);

// List all students
router.get('/', userController.listUsers);

// View profile: self or any classmate
router.get('/me', (req, res, next) => {
  req.params.identifier = 'me';
  return userController.getProfile(req, res, next);
});
router.get('/:identifier', userController.getProfile);

// Edit own profile (enforced in controller)
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.put('/:id', validate(updateProfileSchema), userController.updateProfile);

// User's own posts
router.post('/posts', postRateLimiter, validate(createPostSchema), userController.createPost);
router.delete('/posts/:postId', userController.deletePost);

export default router;
