# Functional Controllers Usage Examples

This directory contains examples demonstrating how to use the functional controllers in different scenarios.

## Overview

The functional controllers approach offers several benefits:

- **Improved testability** through dependency injection
- **Better separation of concerns** with focused controller functions
- **Reduced side effects** with pure functions
- **More modular code** that's easier to compose and reuse
- **Alignment with modern JavaScript** practices

## Examples Included

### 1. Basic Usage

```javascript
// Use controllers directly from the main container
await controllers.trello.getBoards(req, res);
```

### 2. Testing with Custom Dependencies

```javascript
// Create controller with mocked dependencies for testing
const controller = getBoardsController(mockTrelloService, mockPrisma);

// Test the controller
await controller(req, res);

// Verify dependencies were called correctly
expect(mockTrelloService.getBoards).toHaveBeenCalledWith('test-key', 'test-token');
```

### 3. Custom Error Handling

```javascript
try {
  // Use the modern NL-to-SQL controller
  await controllers.ai.nlToSql(req, res);
} catch (error) {
  // Custom error handling
  console.error('Error processing NL-to-SQL query:', error);
  res.status(500).json({
    success: false,
    error: 'An error occurred while processing your query',
    code: 'NL_TO_SQL_ERROR'
  });
}
```

### 4. Custom Dependencies for Production

```javascript
// Create custom dependencies for NL-to-SQL
const customOpenAI = new OpenAI({
  apiKey: process.env.CUSTOM_OPENAI_API_KEY,
  maxRetries: 5,
  timeout: 30000
});

const customLangchainService = new LangChainSqlService(
  process.env.OPENAI_API_KEY, 
  customPrisma
);

// Create controller with custom dependencies
const customController = langchainNlToSqlController(customOpenAI, customPrisma, customLangchainService);
```

### 5. Middleware Composition

```javascript
// Create a protected route with middleware composition
const protectedRoute = [
  authMiddleware,
  rateLimitingMiddleware,
  controllers.ai.nlToSql
];

// Use in Express
router.post('/api/ai/nl-to-sql', protectedRoute);
```

### 6. Using controllers from the main container

```javascript
// Using controllers from the main container
await controllers.ai.nlToSql(req, res);
```

### 7. Custom controller creation for different services

```javascript
// Custom controller creation for different services
const createCustomNlToSqlController = () => {
  // Custom dependencies
  const customOpenAI = new OpenAI({ apiKey: process.env.CUSTOM_OPENAI_API_KEY });
  const customPrisma = new PrismaClient({ log: ['query'] });
  const customLangchainService = new LangChainSqlService(process.env.OPENAI_API_KEY, customPrisma);
  
  return langchainNlToSqlController(customOpenAI, customPrisma, customLangchainService);
};

// Usage in routes
app.post('/api/ai/nl-to-sql', 
  validateBody(nlToSqlSchema),
  asyncHandler(controllers.ai.nlToSql)
);
```

## Running the Examples

These examples are for demonstration purposes and are not meant to be run directly. They show patterns that you can use in your actual application code.

## Best Practices

1. **Use the controllers container** for standard use cases
2. **Create custom controllers** when you need different dependencies
3. **Compose middleware** with controllers for reusable route patterns
4. **Mock dependencies** in tests rather than the entire controller
5. **Keep controllers focused** on a single responsibility

## Further Reading

For more information on the functional controllers approach, see:

- [FUNCTIONAL_CONTROLLERS.md](../../FUNCTIONAL_CONTROLLERS.md) - Detailed documentation
- [STATIC_METHODS_REFACTOR.md](../../STATIC_METHODS_REFACTOR.md) - Refactoring guide
