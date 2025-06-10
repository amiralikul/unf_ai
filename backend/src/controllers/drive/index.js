import getFilesController from "./getFiles.js";
import getFileByIdController from "./getFileById.js";
import syncFilesController from "./syncFiles.js";
import updateFileController from "./updateFile.js";
import deleteFileController from "./deleteFile.js";

/**
 * Factory function to create Drive controllers with dependencies
 *
 * @param {object} dependencies - Controller dependencies
 * @returns {object} Drive controllers
 */
export const createDriveControllers = ({ googleOAuth, prisma, linkDetectionService }) => ({
  getFiles: getFilesController(googleOAuth, prisma),
  getFileById: getFileByIdController(googleOAuth, prisma),
  syncFiles: syncFilesController(googleOAuth, prisma, linkDetectionService),
  updateFile: updateFileController(googleOAuth, prisma),
  deleteFile: deleteFileController(googleOAuth, prisma)
});

export {
  getFilesController,
  getFileByIdController,
  syncFilesController,
  updateFileController,
  deleteFileController
};
