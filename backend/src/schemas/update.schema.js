import { z } from 'zod';

const safeUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (val) => !val || /^(https?:\/\/|mailto:|\/)/i.test(val),
    { message: 'Link URL must begin with http:// or https://' }
  )
  .optional()
  .nullable();

export const createUpdateSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(5, 'Description must be at least 5 characters')
    .max(4000, 'Description cannot exceed 4000 characters'),
  category: z.enum(['Announcements', 'Academic Updates', 'Events', 'Opportunities']).optional().default('Announcements'),
  organizer: z.string().trim().max(100).optional().nullable(),
  venue: z.string().trim().max(100).optional().nullable(),
  deadline: z.string().datetime().optional().nullable().or(z.string().max(100).optional()),
  deadlineText: z.string().trim().max(100).optional().nullable(),
  linkUrl: safeUrlSchema,
  tags: z.union([z.array(z.string().trim().max(40)), z.string().trim().max(200)]).optional(),
  isOfficial: z.boolean().optional().default(false),
});

export const updateUpdateSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(5).max(4000).optional(),
  category: z.enum(['Announcements', 'Academic Updates', 'Events', 'Opportunities']).optional(),
  organizer: z.string().trim().max(100).optional().nullable(),
  venue: z.string().trim().max(100).optional().nullable(),
  deadline: z.string().datetime().optional().nullable().or(z.string().max(100).optional()),
  deadlineText: z.string().trim().max(100).optional().nullable(),
  linkUrl: safeUrlSchema,
  tags: z.union([z.array(z.string().trim().max(40)), z.string().trim().max(200)]).optional(),
  isOfficial: z.boolean().optional(),
});
