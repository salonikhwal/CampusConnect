import { Router } from 'express';
import * as postController from '../controllers/post.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  updateCommentSchema,
} from '../schemas/post.schema.js';
import { postRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Post CRUD & Discovery
router.get('/', postController.getPosts);
router.post('/', postRateLimiter, validate(createPostSchema), postController.createPost);
router.get('/:id', postController.getPostById);
router.put('/:id', validate(updatePostSchema), postController.updatePost);
router.delete('/:id', postController.deletePost);
router.post('/:id/like', postRateLimiter, postController.togglePostLike);

// Comments & Threaded Replies
router.post('/:id/comments', postRateLimiter, validate(createCommentSchema), postController.createComment);
router.put('/:id/comments/:commentId', validate(updateCommentSchema), postController.updateComment);
router.delete('/:id/comments/:commentId', postController.deleteComment);

export default router;
