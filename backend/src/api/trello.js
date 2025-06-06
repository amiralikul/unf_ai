import express from 'express';
import { requireAuth } from './auth.js';
import TrelloController from '../controllers/TrelloController.js';
import { validateQuery, validateParams } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { 
  trelloBoardsQuerySchema, 
  trelloCardsQuerySchema, 
  trelloBoardParamSchema 
} from '../validation/schemas.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/trello/boards - Get Trello boards with pagination and filtering
router.get('/boards', 
  validateQuery(trelloBoardsQuerySchema),
  asyncHandler(TrelloController.getBoards.bind(TrelloController))
);

// GET /api/trello/boards/:boardId - Get a specific board by ID
router.get('/boards/:boardId',
  validateParams(trelloBoardParamSchema),
  asyncHandler(TrelloController.getBoardById.bind(TrelloController))
);

// GET /api/trello/boards/:boardId/cards - Get cards for a specific board
router.get('/boards/:boardId/cards',
  validateParams(trelloBoardParamSchema),
  validateQuery(trelloCardsQuerySchema),
  asyncHandler(TrelloController.getBoardCards.bind(TrelloController))
);

// POST /api/trello/sync - Sync boards and cards from Trello
router.post('/sync',
  asyncHandler(TrelloController.syncBoards.bind(TrelloController))
);

export default router;
