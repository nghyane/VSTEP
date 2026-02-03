import { z } from "zod";

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

export type IdParam = z.infer<typeof IdParamSchema>;

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.any()).optional(),
  }),
});

export type SuccessResponse<T> = {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};
