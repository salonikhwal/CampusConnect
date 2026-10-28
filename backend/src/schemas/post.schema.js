import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().trim().max(150, 'Title cannot exceed 150 characters').optional().nullable(),
  content: z.string({ required_error: 'Post content is required' }).trim().min(1, 'Post content cannot be empty').max(5000, 'Post content cannot exceed 5000 characters'),
  category: z.enum(['Questions', 'Projects', 'College Life', 'Opportunities']).optional().default('Questions'),
  tags: z.union([z.array(z.string().trim().max(40)), z.string().trim().max(200)]).optional(),
  codeSnippet: z.string().max(8000, 'Code snippet cannot exceed 8000 characters').optional().nullable(),
  codeLanguage: z.string().trim().max(30).optional().default('cpp'),
  isPinned: z.boolean().optional(),
});

export const updatePostSchema = z.object({
  title: z.string().trim().max(150).optional().nullable(),
  content: z.string().trim().min(1).max(5000).optional(),
  category: z.enum(['Questions', 'Projects', 'College Life', 'Opportunities']).optional(),
  tags: z.union([z.array(z.string().trim().max(40)), z.string().trim().max(200)]).optional(),
  codeSnippet: z.string().max(8000).optional().nullable(),
  codeLanguage: z.string().trim().max(30).optional(),
  isPinned: z.boolean().optional(),
});

export const createCommentSchema = z.object({
  content: z.string({ required_error: 'Comment content is required' }).trim().min(1, 'Comment cannot be empty').max(2000, 'Comment cannot exceed 2000 characters'),
  parentId: z.string().trim().uuid().optional().nullable(),
});

export const updateCommentSchema = z.object({
  content: z.string({ required_error: 'Comment content is required' }).trim().min(1, 'Comment cannot be empty').max(2000, 'Comment cannot exceed 2000 characters'),
});
