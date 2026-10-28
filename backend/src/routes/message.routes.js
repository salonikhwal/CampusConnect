import { Router } from 'express';
import * as messageController from '../controllers/message.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  sayHiSchema,
  sendMessageSchema,
  blockUserSchema,
  unblockUserSchema,
  reportUserSchema,
} from '../schemas/message.schema.js';
import { messageRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Say Hi: Send starter note and initiate direct conversation
router.post('/say-hi', messageRateLimiter, validate(sayHiSchema), messageController.sayHi);

// Direct Conversations
router.get('/conversations', messageController.getConversations);
router.get('/conversations/:conversationId', messageController.getConversationMessages);
router.post(
  '/conversations/:conversationId/messages',
  messageRateLimiter,
  validate(sendMessageSchema),
  messageController.sendMessage
);
router.post('/conversations/:conversationId/read', messageController.markConversationRead);
router.post('/conversations/:conversationId/ignore', messageController.ignoreConversation);

// Campus Group Chats
router.get('/groups', messageController.getGroups);
router.get('/groups/:groupId', messageController.getGroupMessages);
router.post(
  '/groups/:groupId/messages',
  messageRateLimiter,
  validate(sendMessageSchema),
  messageController.sendGroupMessage
);

// Block & Safety
router.post('/block', validate(blockUserSchema), messageController.blockUser);
router.post('/unblock', validate(unblockUserSchema), messageController.unblockUser);
router.get('/blocks', messageController.getBlockedUsers);

// Report
router.post('/report', validate(reportUserSchema), messageController.reportUser);

export default router;
