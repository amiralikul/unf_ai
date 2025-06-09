import { z } from 'zod';

// Common schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

// Drive schemas
export const driveFilesQuerySchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  mimeType: z.string().optional(),
  modifiedAfter: z.string().datetime().optional(),
  modifiedBefore: z.string().datetime().optional(),
});

// Gmail schemas
export const gmailMessagesQuerySchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  includeSpamTrash: z.boolean().default(false),
});

// Trello schemas
export const trelloBoardsQuerySchema = z.object({
  ...paginationSchema.shape,
  filter: z.enum(['all', 'open', 'closed']).default('open'),
});

export const trelloCardsQuerySchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  filter: z.string().optional().default('all'), // Made more flexible to accept any status value
});

export const trelloBoardParamSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
});

// AI schemas
export const nlToSqlSchema = z.object({
  question: z.string().min(1, 'Question is required').max(1000, 'Question too long'),
});

// Response schemas for consistent API responses
export const successResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.any(),
  meta: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    total: z.number().optional(),
    totalPages: z.number().optional(),
  }).optional(),
});

export const errorResponseSchema = z.object({
  success: z.boolean().default(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
});
