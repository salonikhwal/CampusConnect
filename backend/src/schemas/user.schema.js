import { z } from 'zod';

const safeUrlSchema = z
  .string()
  .trim()
  .max(300)
  .refine(
    (val) => !val || /^(https?:\/\/|mailto:|\/)/i.test(val),
    { message: 'URL must begin with http://, https://, or mailto:' }
  )
  .optional()
  .nullable();

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80).optional(),
  bio: z.string().trim().max(300).optional(),
  about: z.string().trim().max(2000).optional(),
  currentlyLearning: z.string().trim().max(500).optional(),
  hostel: z.string().trim().max(100).optional(),
  roomNo: z.string().trim().max(20).optional(),
  labGroup: z.string().trim().max(50).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  githubUrl: safeUrlSchema,
  linkedinUrl: safeUrlSchema,
  portfolioUrl: safeUrlSchema,
  courses: z.string().trim().max(200).optional(),
  batchYear: z.number().int().min(2018).max(2035).optional(),

  // Can be array or stringified JSON
  interests: z.union([z.array(z.string().trim().max(50)), z.string()]).optional(),
  skills: z.union([z.array(z.string().trim().max(50)), z.string()]).optional(),
  openTo: z.union([z.array(z.string().trim().max(100)), z.string()]).optional(),
  projects: z.union([
    z.array(
      z.object({
        id: z.string().optional(),
        title: z.string().trim().min(1, 'Project title is required').max(150),
        description: z.string().trim().max(2000).optional(),
        techStack: z.union([z.array(z.string()), z.string()]).optional(),
        githubUrl: safeUrlSchema,
        liveUrl: safeUrlSchema,
        link: safeUrlSchema,
      })
    ),
    z.string(),
  ]).optional(),

  privacySettings: z.union([
    z.object({
      showContactDetails: z.boolean().optional(),
      showRoomNumber: z.boolean().optional(),
      allowDirectHi: z.boolean().optional(),
      showSchedule: z.boolean().optional(),
    }),
    z.string(),
  ]).optional(),
});

export const createPostSchema = z.object({
  content: z.string().trim().min(1, 'Post content cannot be empty').max(5000),
  codeSnippet: z.string().max(8000).optional().nullable(),
  codeLanguage: z.string().max(30).optional().default('cpp'),
  category: z.string().max(50).optional().default('Questions'),
});
