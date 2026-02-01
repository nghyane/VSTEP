import { Elysia } from 'elysia';
import {
  WritingSubmissionSchema,
  CreateWritingSubmissionSchema,
} from '../schemas/submission';

// Mock database
const submissions = new Map<string, any>();

export const submissionRoutes = new Elysia({ prefix: '/api' })
  .post(
    '/submissions/writing',
    async ({ body }) => {
      const id = crypto.randomUUID();
      const submission = {
        id,
        userId: crypto.randomUUID(), // TODO: Get from auth
        ...body,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      
      submissions.set(id, submission);
      
      // TODO: Enqueue to grading service
      
      return submission;
    },
    {
      body: CreateWritingSubmissionSchema,
      response: WritingSubmissionSchema,
      detail: {
        summary: 'Create writing submission',
        tags: ['Submissions'],
      },
    }
  )
  
  .get(
    '/submissions/:id',
    async ({ params: { id } }) => {
      const submission = submissions.get(id);
      
      if (!submission) {
        throw new Error('Submission not found');
      }
      
      return submission;
    },
    {
      response: WritingSubmissionSchema,
      detail: {
        summary: 'Get submission by ID',
        tags: ['Submissions'],
      },
    }
  );
