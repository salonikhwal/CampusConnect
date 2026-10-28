import { z } from 'zod';

export const optInGuidanceSchema = z.object({
  guidanceTopics: z.union([
    z.array(z.string().trim().max(100)).min(1, 'Please specify at least one guidance topic'),
    z.string().trim().min(1, 'Please specify at least one guidance topic'),
  ]),
  guidanceBio: z.string().trim().max(1000, 'Guidance bio cannot exceed 1000 characters').optional().nullable(),
  guidanceAvailability: z.string().trim().max(250, 'Availability cannot exceed 250 characters').optional().nullable(),
});
