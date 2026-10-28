import { z } from 'zod';

export const sayHiSchema = z.object({
  recipientId: z.string({ required_error: 'Recipient identifier is required' }).trim().min(1),
  note: z
    .string({ required_error: 'Starter note is required' })
    .trim()
    .min(1, 'Starter note cannot be empty')
    .max(1000, 'Starter note cannot exceed 1000 characters'),
});

export const sendMessageSchema = z.object({
  content: z
    .string({ required_error: 'Message content cannot be empty' })
    .trim()
    .min(1, 'Message content cannot be empty')
    .max(3000, 'Message cannot exceed 3000 characters'),
});

export const blockUserSchema = z.object({
  targetUserId: z.string({ required_error: 'Target user ID is required' }).trim().min(1),
});

export const unblockUserSchema = z.object({
  targetUserId: z.string({ required_error: 'Target user ID is required' }).trim().min(1),
});

export const reportUserSchema = z.object({
  reportedUserId: z.string({ required_error: 'Reported user ID is required' }).trim().min(1),
  reason: z.string({ required_error: 'Report reason is required' }).trim().min(1).max(200),
  details: z.string().trim().max(1000).optional().nullable(),
  alsoBlock: z.boolean().optional().default(false),
});
