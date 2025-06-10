# Functional Controllers Architecture

This document describes the functional approach to controllers implemented in this project, along with guidelines for refactoring existing class-based controllers.

## Overview

We've adopted a functional approach to controllers with explicit dependency injection, which offers several advantages:

- **Improved testability**: Dependencies are explicitly injected, making them easy to mock
- **Reduced side effects**: Pure functions with explicit inputs and outputs
- **Better separation of concerns**: Each controller function focuses on a single responsibility
- **More modular**: Easier to compose and reuse functions
- **Alignment with modern JS**: Takes advantage of JavaScript's functional capabilities

## Directory Structure

```
/backend
  /src
    /controllers
      /ai                  # AI controllers (refactored to functional approach)
        index.js           # Exports all AI controllers
        langchainNlToSqlController.js  # NL-to-SQL controller functions
        /__tests__         # Tests for AI controllers
      /drive               # Drive controllers (to be refactored)
      /gmail               # Gmail controllers (to be refactored)
      /trello              # Trello controllers (to be refactored)
      index.js             # Main entry point that sets up all controllers with dependencies
    /utils
      responses.js         # Response formatting utilities
      pagination.js        # Pagination utilities
    /middleware
      pagination.js        # Pagination middleware
```

## Key Components

### 1. Controller Factory Functions

Each controller is implemented as a factory function that takes dependencies and returns a route handler:

```javascript
// controllers/ai/langchainNlToSqlController.js
export const langchainNlToSqlController = (openai, prisma, langchainService) => async (req, res) => {
  // Implementation using NL-to-SQL with LangChain
};
```

### 2. Shared Utilities

Common operations are extracted into utility functions:

```javascript
// utils/responses.js
export const sendSuccess = (res, data, meta = {}) => {
  res.json({
    success: true,
    data,
    meta
  });
};
```

### 3. Dependency Injection

Dependencies are initialized and injected in the main controllers index:

```javascript
// controllers/index.js
export const controllers = {
  ai: createAIControllers({ openai, prisma }),
  // Other controllers...
};
```

### 4. Route Setup

Routes use the controllers from the dependency injection container:

```javascript
// api/ai.js
router.post('/nl-to-sql',
  validateBody(nlToSqlSchema),
  asyncHandler(controllers.ai.nlToSql)
);
```

## Testing

The functional approach makes testing much easier:

```javascript
// controllers/ai/__tests__/langchainNlToSqlController.test.js
test('should process NL query and return SQL results', async () => {
  // Create controller with mocked dependencies
  const controller = langchainNlToSqlController(mockOpenAI, mockPrisma, mockLangchainService);
  
  // Call the controller
  await controller(req, res);
  
  // Assertions...
});
```

## Refactoring Guide

To refactor an existing class-based controller to the functional approach:

1. **Create a directory** for the controller domain (e.g., `/controllers/trello`)

2. **Split each method** into its own file with a factory function:

   ```javascript
   // Before (class-based):
   class TrelloController {
     static async getBoards(req, res) {
       // Implementation
     }
   }

   // After (functional):
   // controllers/trello/getBoards.js
   export const getBoardsController = (trelloService, prisma) => async (req, res) => {
     // Implementation
   };
   ```

3. **Extract common operations** into utility functions

4. **Create an index.js** in the controller directory to export all controllers:

   ```javascript
   // controllers/trello/index.js
   export const createTrelloControllers = ({ trelloService, prisma }) => ({
     getBoards: getBoardsController(trelloService, prisma),
     // Other controllers...
   });
   ```

5. **Add the controllers** to the main controllers index:

   ```javascript
   // controllers/index.js
   export const controllers = {
     ai: createAIControllers({ openai, prisma }),
     trello: createTrelloControllers({ trelloService, prisma }),
     // Other controllers...
   };
   ```

6. **Update the routes** to use the new controllers:

   ```javascript
   // api/trello.js
   router.get('/boards',
     validateQuery(boardQuerySchema),
     asyncHandler(controllers.trello.getBoards)
   );
   ```

7. **Write tests** for the new controllers

## Benefits

- **Explicit dependencies**: Dependencies are clearly visible and injected
- **Improved testability**: Easy to mock dependencies for unit testing
- **Better separation of concerns**: Each controller function focuses on a single responsibility
- **More modular**: Easier to compose and reuse functions
- **Reduced side effects**: Pure functions with explicit inputs and outputs
- **Alignment with modern JS**: Takes advantage of JavaScript's functional capabilities
