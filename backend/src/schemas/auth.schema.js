import { z } from 'zod';
import { config } from '../config/env.js';

export const signupSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase()
    .refine(
      (email) => email.endsWith(`@${config.allowedEmailDomain}`),
      {
        message: `Only email addresses ending in @${config.allowedEmailDomain} are permitted (e.g. 2023ucse042@${config.allowedEmailDomain})`,
      }
    ),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password must not exceed 100 characters'),
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(80, 'Name must not exceed 80 characters'),
  rollNumber: z
    .string({ required_error: 'Roll number is required' })
    .trim()
    .toUpperCase()
    .min(6, 'Roll number must be at least 6 characters (e.g. 2023UCSE042)')
    .max(20, 'Roll number must not exceed 20 characters')
    .regex(/^[0-9A-Z]+$/, 'Roll number must contain only alphanumeric characters'),
  batchYear: z
    .number()
    .int()
    .min(2018, 'Batch year must be 2018 or later')
    .max(2035, 'Invalid batch year')
    .optional(),
  hostel: z.string().trim().max(100).optional(),
  roomNo: z.string().trim().max(20).optional(),
  labGroup: z.string().trim().max(50).optional(),
  department: z.string().trim().max(100).optional().default('Computer Science & Engineering'),
  bio: z.string().trim().max(300).optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase()
    .refine(
      (email) => email.endsWith(`@${config.allowedEmailDomain}`),
      {
        message: `Only email addresses ending in @${config.allowedEmailDomain} are permitted`,
      }
    ),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80).optional(),
  batchYear: z.number().int().min(2018).max(2035).optional(),
  interests: z.union([z.array(z.string()), z.string()]).optional(),
  skills: z.union([z.array(z.string()), z.string()]).optional(),
  openTo: z.union([z.array(z.string()), z.string()]).optional(),
  hostel: z.string().trim().max(100).optional(),
  roomNo: z.string().trim().max(20).optional(),
  labGroup: z.string().trim().max(50).optional(),
  bio: z.string().trim().max(300).optional(),
});

