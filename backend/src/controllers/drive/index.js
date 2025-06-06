import getFilesController from './getFiles.js';
import getFileByIdController from './getFileById.js';
import syncFilesController from './syncFiles.js';

/**
 * Factory function to create Drive controllers with dependencies
 * 
 * @param {object} dependencies - Controller dependencies
 * @returns {object} Drive controllers
 */
export const createDriveControllers = ({ googleOAuth, prisma }) => ({
  getFiles: getFilesController(googleOAuth, prisma),
  getFileById: getFileByIdController(googleOAuth, prisma),
  syncFiles: syncFilesController(googleOAuth, prisma)
});

export {
  getFilesController,
  getFileByIdController,
  syncFilesController
};
