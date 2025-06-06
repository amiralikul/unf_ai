/**
 * Test file for getBoards controller
 *
 * This demonstrates how to test the functional controllers
 * with dependency injection for easier mocking
 */

// Import Jest functions
import { jest, describe, test, beforeEach, expect } from '@jest/globals';

// Import the controller factory
import { getBoardsController } from '../getBoards.js';

describe('getBoards controller', () => {
  // Mock dependencies
  const mockTrelloService = {
    getBoards: jest.fn()
  };
  
  const mockPrisma = {
    trelloBoard: {
      findMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn()
    },
    $transaction: jest.fn(callback => callback(mockPrisma))
  };
  
  // Mock request and response
  const req = {
    user: { userId: 'user123' },
    query: { page: '1', limit: '10' }
  };
  
  const res = {
    json: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.TRELLO_API_KEY = 'test-key';
    process.env.TRELLO_TOKEN = 'test-token';
    
    // Set up mock return values
    mockTrelloService.getBoards.mockResolvedValue([
      { id: 'board1', name: 'Board 1', url: 'https://trello.com/board1' }
    ]);
    
    mockPrisma.trelloBoard.upsert.mockResolvedValue({
      id: 'db1',
      trelloId: 'board1',
      name: 'Board 1',
      url: 'https://trello.com/board1'
    });
    
    mockPrisma.trelloBoard.findMany.mockResolvedValue([
      {
        id: 'db1',
        trelloId: 'board1',
        name: 'Board 1',
        url: 'https://trello.com/board1',
        _count: { cards: 5 }
      }
    ]);
    
    mockPrisma.trelloBoard.count.mockResolvedValue(1);
  });
  
  test('should fetch and return boards successfully', async () => {
    // Create controller with mocked dependencies
    const controller = getBoardsController(mockTrelloService, mockPrisma);
    
    // Call the controller
    await controller(req, res);
    
    // Verify dependencies were called correctly
    expect(mockTrelloService.getBoards).toHaveBeenCalledWith('test-key', 'test-token');
    
    expect(mockPrisma.trelloBoard.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user123' },
      skip: 0,
      take: 10
    }));
    
    // Verify response
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        boards: expect.arrayContaining([
          expect.objectContaining({
            id: 'board1',
            name: 'Board 1',
            cardCount: 5
          })
        ])
      }),
      meta: expect.objectContaining({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        synced: 1
      })
    }));
  });
  
  test('should handle missing Trello credentials', async () => {
    // Remove API credentials
    delete process.env.TRELLO_API_KEY;
    delete process.env.TRELLO_TOKEN;
    
    // Create controller with mocked dependencies
    const controller = getBoardsController(mockTrelloService, mockPrisma);
    
    // Mock the error handling
    const next = jest.fn();
    
    // Call the controller with next function for error handling
    await controller(req, { json: res.json }, next).catch(next);
    
    // Verify error was thrown
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      name: 'AuthenticationError',
      message: 'Trello API credentials not configured',
      code: 'TRELLO_AUTH_REQUIRED'
    }));
  });
  
  test('should handle Trello API errors', async () => {
    // Set up API error
    mockTrelloService.getBoards.mockRejectedValue(new Error('API connection failed'));
    
    // Create controller with mocked dependencies
    const controller = getBoardsController(mockTrelloService, mockPrisma);
    
    // Mock the error handling
    const next = jest.fn();
    
    // Call the controller with next function for error handling
    await controller(req, { json: res.json }, next).catch(next);
    
    // Verify error was thrown
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      name: 'ExternalServiceError',
      message: expect.stringContaining('API connection failed')
    }));
  });
});
