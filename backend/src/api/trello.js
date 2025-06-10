import express from 'express';
import { requireAuth } from './auth.js';
import controllers from '../controllers/index.js';
import { validateQuery, validateParams, validateBody } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import paginationMiddleware from '../middleware/pagination.js';
import { 
  trelloBoardsQuerySchema, 
  trelloCardsQuerySchema, 
  trelloBoardParamSchema,
  trelloCardParamSchema,
  updateTrelloCardSchema
} from '../validation/schemas.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/trello/boards - Get Trello boards with pagination and filtering
router.get('/boards',
  validateQuery(trelloBoardsQuerySchema),
  paginationMiddleware,
  asyncHandler(controllers.trello.getBoards)
);

// GET /api/trello/boards/:boardId/cards - Get cards for a specific board
router.get('/boards/:boardId/cards',
  validateParams(trelloBoardParamSchema),
  validateQuery(trelloCardsQuerySchema),
  paginationMiddleware,
  asyncHandler(controllers.trello.getBoardCards)
);

// POST /api/trello/sync - Sync boards and cards from Trello
router.post('/sync',
  asyncHandler(controllers.trello.syncBoards)
);

// PATCH /api/trello/cards/:cardId - Update a Trello card
router.patch('/cards/:cardId',
  validateParams(trelloCardParamSchema),
  validateBody(updateTrelloCardSchema),
  asyncHandler(controllers.trello.updateCard)
);

// DELETE /api/trello/cards/:cardId - Delete a Trello card
router.delete('/cards/:cardId',
  validateParams(trelloCardParamSchema),
  asyncHandler(controllers.trello.deleteCard)
);

// TODO: Implement getBoardById controller in functional approach
// GET /api/trello/boards/:boardId - Get a specific board by ID
// router.get('/boards/:boardId',
//   validateParams(trelloBoardParamSchema),
//   asyncHandler(controllers.trello.getBoardById)
// );

export default router;
