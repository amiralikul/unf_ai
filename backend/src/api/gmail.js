import express from "express";
import { requireAuth } from "./auth.js";
import controllers from "../controllers/index.js";
import { validateQuery, validateParams, validateBody } from "../middleware/validation.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import paginationMiddleware from "../middleware/pagination.js";
import {
  gmailMessagesQuerySchema,
  messageIdParamSchema,
  updateMessageSchema,
  paginationSchema
} from "../validation/schemas.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/gmail/messages - Get Gmail messages with pagination and filtering
router.get(
  "/messages",
  validateQuery(gmailMessagesQuerySchema),
  paginationMiddleware,
  asyncHandler(controllers.gmail.getMessages)
);

// GET /api/gmail/messages/:messageId - Get a specific message by ID
router.get(
  "/messages/:messageId",
  validateParams(messageIdParamSchema),
  asyncHandler(controllers.gmail.getMessageById)
);

// POST /api/gmail/sync - Sync messages from Gmail
router.post("/sync", asyncHandler(controllers.gmail.syncMessages));

// PATCH /api/gmail/messages/:messageId - Update message metadata
router.patch(
  "/messages/:messageId",
  validateParams(messageIdParamSchema),
  validateBody(updateMessageSchema),
  asyncHandler(controllers.gmail.updateMessage)
);

// DELETE /api/gmail/messages/:messageId - Delete a message from database
router.delete(
  "/messages/:messageId",
  validateParams(messageIdParamSchema),
  asyncHandler(controllers.gmail.deleteMessage)
);

// TODO: Implement getThreads controller in functional approach
// GET /api/gmail/threads - Get message threads
// router.get('/threads',
//   validateQuery(paginationSchema),
//   paginationMiddleware,
//   asyncHandler(controllers.gmail.getThreads)
// );

export default router;
