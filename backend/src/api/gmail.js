import express from 'express';
import { requireAuth } from './auth.js';
import GmailController from '../controllers/GmailController.js';
import { validateQuery, validateParams } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { gmailMessagesQuerySchema, idParamSchema, paginationSchema } from '../validation/schemas.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/gmail/messages - Get Gmail messages with pagination and filtering
router.get('/messages', 
  validateQuery(gmailMessagesQuerySchema),
  asyncHandler(GmailController.getMessages.bind(GmailController))
);

// GET /api/gmail/messages/:id - Get a specific message by ID
router.get('/messages/:id',
  validateParams(idParamSchema),
  asyncHandler(GmailController.getMessageById.bind(GmailController))
);

// DELETE /api/gmail/messages/:id - Delete a message from database
router.delete('/messages/:id',
  validateParams(idParamSchema),
  asyncHandler(GmailController.deleteMessage.bind(GmailController))
);

// GET /api/gmail/threads - Get message threads
router.get('/threads',
  validateQuery(paginationSchema),
  asyncHandler(GmailController.getThreads.bind(GmailController))
);

// POST /api/gmail/sync - Sync messages from Gmail
router.post('/sync',
  asyncHandler(GmailController.syncMessages.bind(GmailController))
);

export default router;
