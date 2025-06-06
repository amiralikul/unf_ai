/**
 * Example of how to use the functional controllers
 * 
 * This file demonstrates how to use the functional controllers
 * in different scenarios, including testing and dependency injection.
 */

// Import controllers
import { controllers } from '../controllers/index.js';
import { getBoardsController } from '../controllers/trello/getBoards.js';
import { processQueryController } from '../controllers/ai/processQuery.js';

// Example 1: Using controllers from the main container
async function exampleApiRoute(req, res) {
  // Use the controller directly from the container
  await controllers.trello.getBoards(req, res);
}

// Example 2: Creating a controller with custom dependencies for testing
function exampleTestSetup() {
  // Mock dependencies
  const mockTrelloService = {
    getBoards: jest.fn().mockResolvedValue([
      { id: 'board1', name: 'Test Board', url: 'https://trello.com/board1' }
    ])
  };
  
  const mockPrisma = {
    trelloBoard: {
      findMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn()
    },
    $transaction: jest.fn(callback => callback(mockPrisma))
  };
  
  // Create controller with mocked dependencies
  const controller = getBoardsController(mockTrelloService, mockPrisma);
  
  return { controller, mockTrelloService, mockPrisma };
}

// Example 3: Using a controller with custom error handling
async function exampleWithErrorHandling(req, res, next) {
  try {
    // Use the controller
    await controllers.ai.processQuery(req, res);
  } catch (error) {
    // Custom error handling
    console.error('Error processing AI query:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your query',
      code: 'AI_PROCESSING_ERROR'
    });
  }
}

// Example 4: Creating a controller with custom dependencies for production
function createCustomAIController() {
  // Custom OpenAI instance with different configuration
  const customOpenAI = new OpenAI({
    apiKey: process.env.CUSTOM_OPENAI_API_KEY,
    maxRetries: 5,
    timeout: 30000
  });
  
  // Custom Prisma instance with logging
  const customPrisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
  });
  
  // Create controller with custom dependencies
  return processQueryController(customOpenAI, customPrisma);
}

// Example 5: Middleware composition with functional controllers
function createProtectedRoute(controller) {
  return [
    // Authentication middleware
    (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      next();
    },
    // Rate limiting middleware
    (req, res, next) => {
      // Rate limiting logic
      next();
    },
    // The controller itself
    controller
  ];
}

// Usage of middleware composition
const protectedAIQueryRoute = createProtectedRoute(controllers.ai.processQuery);

// Export examples for documentation
export {
  exampleApiRoute,
  exampleTestSetup,
  exampleWithErrorHandling,
  createCustomAIController,
  createProtectedRoute
};
