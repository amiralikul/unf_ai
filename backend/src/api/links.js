import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createLinkControllers } from '../controllers/links/index.js';
import { requireAuth } from './auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Create controller instances
const linkControllers = createLinkControllers(prisma);

// Apply authentication middleware to all routes
router.use(requireAuth);

// Card-File Link Routes
router.post('/card-file', asyncHandler(linkControllers.linkCardToFile));
router.delete('/card-file/:cardId/:fileId', asyncHandler(linkControllers.unlinkCardFromFile));

// Card-Email Link Routes  
router.post('/card-email', asyncHandler(linkControllers.linkCardToEmail));
router.delete('/card-email/:cardId/:emailId', asyncHandler(linkControllers.unlinkCardFromEmail));

// Card Links Retrieval
router.get('/card/:cardId', asyncHandler(linkControllers.getCardLinks));

export default router; 