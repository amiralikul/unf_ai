import express from 'express';
import { requireAuth } from './auth.js';
import controllers from '../controllers/index.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { aiQuerySchema, paginationSchema } from '../validation/schemas.js';
import paginationMiddleware from '../middleware/pagination.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/ai/query - Process AI query with user's data context
router.post('/query',
  validateBody(aiQuerySchema),
  asyncHandler(controllers.ai.processQuery)
);

// GET /api/ai/history - Get AI query history (placeholder)
router.get('/history',
  validateQuery(paginationSchema),
  paginationMiddleware,
  asyncHandler(controllers.ai.getQueryHistory)
);

// GET /api/ai/stats - Get AI usage statistics
router.get('/stats',
  asyncHandler(controllers.ai.getUsageStats)
);

export default router;
