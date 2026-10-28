import { z } from 'zod';

const safeUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (val) => !val || /^(https?:\/\/|mailto:|\/)/i.test(val),
    { message: 'URL must begin with http:// or https://' }
  )
  .optional()
  .nullable();

export const createGroupSchema = z.object({
  name: z
    .string({ required_error: 'Group name is required' })
    .trim()
    .min(3, 'Group name must be at least 3 characters')
    .max(100, 'Group name cannot exceed 100 characters'),
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters').optional().nullable(),
  category: z.string().trim().max(50).optional().default('academic'),
  avatarUrl: safeUrlSchema,
});

export const updateGroupSchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  category: z.string().trim().max(50).optional(),
  avatarUrl: safeUrlSchema,
});

export const inviteMemberSchema = z.object({
  userId: z.string({ required_error: 'User ID is required' }).trim().min(1),
});

export const sendGroupMessageSchema = z.object({
  content: z
    .string({ required_error: 'Message content cannot be empty' })
    .trim()
    .min(1, 'Message content cannot be empty')
    .max(3000, 'Message cannot exceed 3000 characters'),
});
