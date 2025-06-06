import express from 'express';
import { requireAuth } from './auth.js';
import controllers from '../controllers/index.js';
import { validateQuery, validateParams } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import paginationMiddleware from '../middleware/pagination.js';
import { driveFilesQuerySchema, idParamSchema } from '../validation/schemas.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/drive/files - Get Drive files with pagination and filtering
router.get('/files',
  validateQuery(driveFilesQuerySchema),
  paginationMiddleware,
  asyncHandler(controllers.drive.getFiles)
);

// GET /api/drive/files/:fileId - Get a specific file by ID
router.get('/files/:fileId',
  validateParams(idParamSchema),
  asyncHandler(controllers.drive.getFileById)
);

// POST /api/drive/sync - Sync files from Google Drive
router.post('/sync',
  asyncHandler(controllers.drive.syncFiles)
);

// TODO: Implement deleteFile controller in functional approach
// DELETE /api/drive/files/:fileId - Delete a file from database
// router.delete('/files/:fileId',
//   validateParams(idParamSchema),
//   asyncHandler(controllers.drive.deleteFile)
// );

export default router;
