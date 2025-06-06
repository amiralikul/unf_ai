/**
 * Test file for processQuery controller
 *
 * This demonstrates how to test the functional controllers
 * with dependency injection for easier mocking
 */

// Import Jest functions
import { jest, describe, test, beforeEach, expect } from '@jest/globals';

// Import the controller factory
import { processQueryController } from '../processQuery.js';

describe('processQuery controller', () => {
  // Mock dependencies
  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  };
  
  const mockPrisma = {
    file: {
      findMany: jest.fn(),
      count: jest.fn()
    },
    email: {
      findMany: jest.fn(),
      count: jest.fn()
    },
    trelloCard: {
      findMany: jest.fn(),
      count: jest.fn()
    }
  };
  
  // Mock request and response
  const req = {
    user: { userId: 'user123' },
    body: {
      query: 'What files do I have?',
      context: 'all',
      includeFiles: true,
      includeEmails: true,
      includeCards: true
    }
  };
  
  const res = {
    json: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.OPENAI_API_KEY = 'test-key';
    
    // Set up mock return values
    mockPrisma.file.findMany.mockResolvedValue([
      { name: 'test.pdf', mimeType: 'application/pdf', modifiedAt: new Date() }
    ]);
    mockPrisma.email.findMany.mockResolvedValue([
      { subject: 'Test Email', sender: 'test@example.com', receivedAt: new Date() }
    ]);
    mockPrisma.trelloCard.findMany.mockResolvedValue([
      { 
        name: 'Test Card', 
        description: 'Test description',
        board: { name: 'Test Board' }
      }
    ]);
    
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'You have 1 PDF file, 1 email, and 1 Trello card.'
          }
        }
      ]
    });
  });
  
  test('should process query and return AI response', async () => {
    // Create controller with mocked dependencies
    const controller = processQueryController(mockOpenAI, mockPrisma);
    
    // Call the controller
    await controller(req, res);
    
    // Verify dependencies were called correctly
    expect(mockPrisma.file.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user123' }
    }));
    
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-3.5-turbo',
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: 'system'
        }),
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining('User Question: What files do I have?')
        })
      ])
    }));
    
    // Verify response
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        query: 'What files do I have?',
        response: 'You have 1 PDF file, 1 email, and 1 Trello card.'
      })
    }));
  });
  
  test('should handle missing OpenAI API key', async () => {
    // Remove API key
    delete process.env.OPENAI_API_KEY;
    
    // Create controller with mocked dependencies
    const controller = processQueryController(mockOpenAI, mockPrisma);
    
    // Mock the error handling
    const next = jest.fn();
    
    // Call the controller with next function for error handling
    await controller(req, { json: res.json }, next).catch(next);
    
    // Verify error was thrown
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      name: 'AuthenticationError',
      message: 'OpenAI API key not configured'
    }));
  });
});
