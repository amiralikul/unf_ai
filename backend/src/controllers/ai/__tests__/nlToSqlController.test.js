import { jest } from '@jest/globals';
import { nlToSqlController } from '../nlToSqlController.js';

// Mock dependencies
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
};

const mockPrisma = {
  $queryRawUnsafe: jest.fn()
};

// Mock request and response
const mockReq = {
  body: { question: 'How many files do I have?' },
  user: { userId: 'test-user-123' }
};

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
};

// Mock environment
process.env.OPENAI_API_KEY = 'test-key';

describe('nlToSqlController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully process NL to SQL query', async () => {
    // Mock OpenAI responses
    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce({
        choices: [{ 
          message: { 
            content: 'SQL: SELECT COUNT(*) as file_count FROM File WHERE userId = \'test-user-123\'\nEXPLANATION: Counts the total number of files for the user' 
          } 
        }]
      })
      .mockResolvedValueOnce({
        choices: [{ 
          message: { 
            content: 'You have 25 files in your Google Drive.' 
          } 
        }]
      });

    // Mock database query result
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ file_count: 25 }]);

    const controller = nlToSqlController(mockOpenAI, mockPrisma);
    await controller(mockReq, mockRes);

    // Verify successful response - note that sendSuccess doesn't call status()
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        question: 'How many files do I have?',
        answer: 'You have 25 files in your Google Drive.',
        sql: expect.objectContaining({
          query: expect.stringContaining('SELECT COUNT(*) as file_count FROM File WHERE userId = \'test-user-123\''),
          explanation: 'Counts the total number of files for the user',
          resultCount: 1
        })
      }),
      meta: {}
    });

    // Verify OpenAI was called twice (SQL generation + response generation)
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2);

    // Verify database query was executed
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT COUNT(*) as file_count FROM File WHERE userId = \'test-user-123\'')
    );
  });

  test('should handle invalid question input', async () => {
    const invalidReq = {
      body: { question: '' },
      user: { userId: 'test-user-123' }
    };

    const controller = nlToSqlController(mockOpenAI, mockPrisma);
    await controller(invalidReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining('Question is required'),
      code: 'VALIDATION_ERROR',
      details: { question: '' }
    });
  });

  test('should handle SQL generation failure', async () => {
    mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI API error'));

    const controller = nlToSqlController(mockOpenAI, mockPrisma);
    await controller(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(503);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'AI service temporarily unavailable. Please try again later.',
      code: 'SERVICE_ERROR',
      details: { question: 'How many files do I have?' }
    });
  });

  test('should handle database execution failure', async () => {
    // Mock successful SQL generation
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{ 
        message: { 
          content: 'SQL: SELECT COUNT(*) as file_count FROM File WHERE userId = \'test-user-123\'\nEXPLANATION: Counts files' 
        } 
      }]
    });

    // Mock database failure
    mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Database connection failed'));

    const controller = nlToSqlController(mockOpenAI, mockPrisma);
    await controller(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Database query failed. Please try rephrasing your question.',
      code: 'DATABASE_ERROR',
      details: { question: 'How many files do I have?' }
    });
  });

  test('should handle missing OpenAI API key', async () => {
    delete process.env.OPENAI_API_KEY;

    const controller = nlToSqlController(mockOpenAI, mockPrisma);
    await controller(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'OpenAI API key not configured',
      code: 'OPENAI_AUTH_REQUIRED',
      details: undefined
    });

    // Restore for other tests
    process.env.OPENAI_API_KEY = 'test-key';
  });
});