import express from 'express';
import { requireAuth } from './auth.js';
import AIController from '../controllers/AIController.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { aiQuerySchema, paginationSchema } from '../validation/schemas.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/ai/query - Process AI query with user's data context
router.post('/query', 
  validateBody(aiQuerySchema),
  asyncHandler(AIController.processQuery.bind(AIController))
);

// GET /api/ai/history - Get AI query history (placeholder)
router.get('/history',
  validateQuery(paginationSchema),
  asyncHandler(AIController.getQueryHistory.bind(AIController))
);

// GET /api/ai/stats - Get AI usage statistics
router.get('/stats',
  asyncHandler(AIController.getUsageStats.bind(AIController))
);

export default router;
