# Refactoring Static Methods to Functional Controllers

This guide provides step-by-step instructions for refactoring the remaining static method controllers to the functional approach with dependency injection.

## Completed Refactoring

So far, we've refactored:

1. **AI Controllers**
   - `nlToSql` (LangChain-based)
   - `getQueryHistory`
   - `getUsageStats`

2. **Trello Controllers**
   - `getBoards`
   - `getBoardCards`
   - `syncBoards`

## Refactoring Steps for Remaining Controllers

### 1. Drive Controllers

#### Create Directory Structure

```bash
mkdir -p backend/src/controllers/drive
mkdir -p backend/src/controllers/drive/__tests__
```

#### Implement Controller Functions

Create the following files:

1. `controllers/drive/getFiles.js`
   ```javascript
   import { sendSuccess } from '../../utils/responses.js';
   import { getPaginationParams, getPaginationMeta } from '../../utils/pagination.js';
   
   export const getFilesController = (googleOAuth, prisma) => async (req, res) => {
     // Implementation...
   };
   
   export default getFilesController;
   ```

2. `controllers/drive/getFileById.js`
3. `controllers/drive/syncFiles.js`
4. `controllers/drive/index.js`
   ```javascript
   import getFilesController from './getFiles.js';
   import getFileByIdController from './getFileById.js';
   import syncFilesController from './syncFiles.js';
   
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
   ```

#### Update Main Controllers Index

Update `controllers/index.js` to include Drive controllers:

```javascript
import { createDriveControllers } from './drive/index.js';

export const controllers = {
  ai: createAIControllers({ openai, prisma }),
  trello: createTrelloControllers({ trelloService, prisma }),
  drive: createDriveControllers({ googleOAuth, prisma }),
  // ...
};
```

#### Update API Routes

Update `api/drive.js` to use the new controllers:

```javascript
import controllers from '../controllers/index.js';

router.get('/files',
  validateQuery(driveFilesQuerySchema),
  paginationMiddleware,
  asyncHandler(controllers.drive.getFiles)
);
```

### 2. Gmail Controllers

#### Create Directory Structure

```bash
mkdir -p backend/src/controllers/gmail
mkdir -p backend/src/controllers/gmail/__tests__
```

#### Implement Controller Functions

Create the following files:

1. `controllers/gmail/getMessages.js`
2. `controllers/gmail/getMessageById.js`
3. `controllers/gmail/syncMessages.js`
4. `controllers/gmail/index.js`

#### Update Main Controllers Index

Update `controllers/index.js` to include Gmail controllers.

#### Update API Routes

Update `api/gmail.js` to use the new controllers.

### 3. Write Tests

For each controller, create test files in the `__tests__` directory:

```javascript
// controllers/drive/__tests__/getFiles.test.js
import { getFilesController } from '../getFiles.js';

describe('getFiles controller', () => {
  // Mock dependencies
  const mockGoogleOAuth = {
    getDriveClient: jest.fn()
  };
  
  const mockPrisma = {
    file: {
      findMany: jest.fn(),
      count: jest.fn()
    }
  };
  
  // Tests...
});
```

## Benefits of the Functional Approach

1. **Improved Testability**: Dependencies are explicitly injected, making them easy to mock
2. **Better Separation of Concerns**: Each controller function focuses on a single responsibility
3. **Reduced Side Effects**: Pure functions with explicit inputs and outputs
4. **More Modular**: Easier to compose and reuse functions
5. **Alignment with Modern JS**: Takes advantage of JavaScript's functional capabilities

## Tips for Refactoring

1. **Start with the simplest controllers** first to get comfortable with the pattern
2. **Extract common functionality** into utility functions
3. **Use the existing implementation** as a reference, but improve error handling and structure
4. **Add comprehensive tests** for each controller
5. **Update one API route file at a time** to minimize disruption

## Example: Refactoring a Static Method

### Before (Static Method)

```javascript
class DriveController {
  static async getFiles(req, res) {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;
    
    try {
      const files = await prisma.file.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });
      
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

### After (Functional Controller)

```javascript
// controllers/drive/getFiles.js
import { sendSuccess } from '../../utils/responses.js';
import { getPaginationParams, getPaginationMeta } from '../../utils/pagination.js';
import { DatabaseError } from '../../utils/errors.js';

export const getFilesController = (googleOAuth, prisma) => async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user.userId;
  const pagination = getPaginationParams({ page, limit });
  
  try {
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: { userId },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' }
      }),
      prisma.file.count({ where: { userId } })
    ]);
    
    const paginationMeta = getPaginationMeta(total, pagination.page, pagination.limit);
    
    sendSuccess(res, { files }, paginationMeta);
  } catch (error) {
    if (error.code && error.code.startsWith('P')) {
      throw new DatabaseError('Failed to retrieve files', 'getFiles', error);
    }
    throw error;
  }
};

export default getFilesController;
```

## Conclusion

By following this guide, you can systematically refactor all remaining controllers to the functional approach. This will result in a more maintainable, testable, and modular codebase that follows modern JavaScript best practices.
