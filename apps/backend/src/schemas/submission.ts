import { z } from 'zod';

/**
 * Submission Status Enum
 */
export const SubmissionStatus = z.enum([
  'PENDING',
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'ERROR'
]);

export type SubmissionStatusType = z.infer<typeof SubmissionStatus>;

/**
 * Writing Submission Schema
 */
export const WritingSubmissionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  taskType: z.enum(['TASK_1_EMAIL', 'TASK_2_ESSAY']),
  content: z.string().min(50).max(2000),
  status: SubmissionStatus,
  scaffoldLevel: z.enum(['TEMPLATE', 'KEYWORDS', 'FREE']),
  createdAt: z.string().datetime(),
});

export type WritingSubmission = z.infer<typeof WritingSubmissionSchema>;

/**
 * Create Submission Request
 */
export const CreateWritingSubmissionSchema = WritingSubmissionSchema.omit({
  id: true,
  userId: true,
  status: true,
  createdAt: true,
});

export type CreateWritingSubmission = z.infer<typeof CreateWritingSubmissionSchema>;
