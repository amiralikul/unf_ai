import express from 'express';
import { requireAuth } from './auth.js';
import DriveController from '../controllers/DriveController.js';
import { validateQuery, validateParams } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { driveFilesQuerySchema, idParamSchema } from '../validation/schemas.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/drive/files - Get Drive files with pagination and filtering
router.get('/files', 
  validateQuery(driveFilesQuerySchema),
  asyncHandler(DriveController.getFiles.bind(DriveController))
);

// GET /api/drive/files/:id - Get a specific file by ID
router.get('/files/:id',
  validateParams(idParamSchema),
  asyncHandler(DriveController.getFileById.bind(DriveController))
);

// DELETE /api/drive/files/:id - Delete a file from database
router.delete('/files/:id',
  validateParams(idParamSchema),
  asyncHandler(DriveController.deleteFile.bind(DriveController))
);

// POST /api/drive/sync - Sync files from Google Drive
router.post('/sync',
  asyncHandler(DriveController.syncFiles.bind(DriveController))
);

export default router;
