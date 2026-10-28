import { Router } from 'express';
import * as groupController from '../controllers/group.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createGroupSchema,
  updateGroupSchema,
  inviteMemberSchema,
  sendGroupMessageSchema,
} from '../schemas/group.schema.js';
import { postRateLimiter, messageRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Groups CRUD & Discovery
router.post('/', postRateLimiter, validate(createGroupSchema), groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/invitations', groupController.getPendingInvitations);

// Single Group Workspace
router.get('/:id', groupController.getGroupById);
router.put('/:id', validate(updateGroupSchema), groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

// Invitations & Member Search
router.get('/:id/invite-candidates', groupController.searchInviteCandidates);
router.post('/:id/invitations', validate(inviteMemberSchema), groupController.sendInvitation);
router.post('/:id/invitations/accept', groupController.acceptInvitation);
router.post('/:id/invitations/decline', groupController.declineInvitation);

// Member Management & Leaving
router.delete('/:id/members/:userId', groupController.removeMemberOrLeave);
router.post('/:id/leave', (req, res, next) => {
  req.params.userId = req.user.id;
  return groupController.removeMemberOrLeave(req, res, next);
});

// Group Messages (accepted members only)
router.get('/:id/messages', groupController.getGroupMessages);
router.post('/:id/messages', messageRateLimiter, validate(sendGroupMessageSchema), groupController.sendGroupMessage);

export default router;
