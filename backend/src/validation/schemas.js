import { z } from "zod";

// Common schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50)
});

export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required")
});

// Drive schemas
export const driveFilesQuerySchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  mimeType: z.string().optional(),
  modifiedAfter: z.string().datetime().optional(),
  modifiedBefore: z.string().datetime().optional()
});

export const updateFileSchema = z.object({
  name: z.string().min(1, "File name is required").max(255, "File name too long")
});

export const fileIdParamSchema = z.object({
  fileId: z.string().min(1, "File ID is required")
});

// Gmail schemas
export const gmailMessagesQuerySchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  includeSpamTrash: z.boolean().default(false)
});

export const messageIdParamSchema = z.object({
  messageId: z.string().min(1, "Message ID is required")
});

export const updateMessageSchema = z.object({
  subject: z.string().max(255, "Subject too long").optional()
});

// Trello schemas
export const trelloBoardsQuerySchema = z.object({
  ...paginationSchema.shape,
  filter: z.enum(["all", "open", "closed"]).default("open")
});

export const trelloCardsQuerySchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  filter: z.string().optional().default("all") // Made more flexible to accept any status value
});

export const trelloBoardParamSchema = z.object({
  boardId: z.string().min(1, "Board ID is required")
});

export const trelloCardParamSchema = z.object({
  cardId: z.string().min(1, "Card ID is required")
});

export const updateTrelloCardSchema = z.object({
  name: z.string().min(1, "Card name is required").max(255, "Card name too long").optional(),
  description: z.string().max(2000, "Description too long").optional(),
  status: z.string().max(100, "Status too long").optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable()
});

// AI schemas
export const nlToSqlSchema = z.object({
  question: z.string().min(1, "Question is required").max(1000, "Question too long")
});

// Response schemas for consistent API responses
export const successResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.any(),
  meta: z
    .object({
      page: z.number().optional(),
      limit: z.number().optional(),
      total: z.number().optional(),
      totalPages: z.number().optional()
    })
    .optional()
});

export const errorResponseSchema = z.object({
  success: z.boolean().default(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional()
});
