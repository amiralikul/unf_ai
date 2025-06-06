/**
 * Test file for getMessages controller
 *
 * This demonstrates how to test the functional controllers
 * with dependency injection for easier mocking
 */

// Import Jest functions
import { jest, describe, test, beforeEach, expect } from '@jest/globals';

// Import the controller factory
import { getMessagesController } from '../getMessages.js';

describe('getMessages controller', () => {
  // Mock dependencies
  const mockGoogleOAuth = {
    getGmailClient: jest.fn()
  };

  const mockPrisma = {
    message: {
      findMany: jest.fn(),
      count: jest.fn()
    }
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
    
    mockPrisma.message.findMany.mockResolvedValue([
      {
        id: 'db1',
        gmailId: 'msg1',
        subject: 'Test Email 1',
        from: 'sender1@example.com',
        to: 'recipient@example.com',
        snippet: 'This is a test email',
        receivedAt: new Date('2025-06-01'),
        isRead: true,
        isImportant: false,
        labels: [
          { id: 'label1', name: 'inbox' },
          { id: 'label2', name: 'work' }
        ]
      },
      {
        id: 'db2',
        gmailId: 'msg2',
        subject: 'Test Email 2',
        from: 'sender2@example.com',
        to: 'recipient@example.com',
        snippet: 'Another test email',
        receivedAt: new Date('2025-06-02'),
        isRead: false,
        isImportant: true,
        labels: [
          { id: 'label1', name: 'inbox' },
          { id: 'label3', name: 'important' }
        ]
      }
    ]);
    
    mockPrisma.message.count.mockResolvedValue(2);
  });
  
  test('should get messages successfully', async () => {
    // Create controller with mocked dependencies
    const controller = getMessagesController(mockGoogleOAuth, mockPrisma);

    // Call the controller
    await controller(req, res);

    // Verify dependencies were called correctly
    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user123' },
      skip: 0,
      take: 10,
      orderBy: { receivedAt: 'desc' },
      include: { labels: true }
    }));

    expect(mockPrisma.message.count).toHaveBeenCalledWith({ where: { userId: 'user123' } });

    // Verify response
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            id: 'msg1',
            subject: 'Test Email 1',
            labelNames: ['inbox', 'work']
          }),
          expect.objectContaining({
            id: 'msg2',
            subject: 'Test Email 2',
            labelNames: ['inbox', 'important']
          })
        ])
      }),
      meta: expect.objectContaining({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      })
    }));
  });
  
  test('should apply filters correctly', async () => {
    // Set up request with filters
    const reqWithFilters = {
      ...req,
      query: {
        ...req.query,
        filter: 'unread',
        search: 'important'
      }
    };
    
    // Create controller with mocked dependencies
    const controller = getMessagesController(mockGoogleOAuth, mockPrisma);
    
    // Call the controller
    await controller(reqWithFilters, res);
    
    // Verify filters were applied correctly
    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: 'user123',
        isRead: false,
        OR: [
          { subject: { contains: 'important', mode: 'insensitive' } },
          { snippet: { contains: 'important', mode: 'insensitive' } },
          { from: { contains: 'important', mode: 'insensitive' } }
        ]
      })
    }));
  });
  
  test('should handle database errors', async () => {
    // Set up database error
    const dbError = new Error('Database connection failed');
    dbError.code = 'P2002'; // Prisma error code
    mockPrisma.message.findMany.mockRejectedValue(dbError);
    
    // Create controller with mocked dependencies
    const controller = getMessagesController(mockGoogleOAuth, mockPrisma);
    
    // Mock the error handling
    const next = jest.fn();
    
    // Call the controller with next function for error handling
    await controller(req, { json: res.json }, next).catch(next);
    
    // Verify error was thrown
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      name: 'DatabaseError',
      message: expect.stringContaining('Failed to access messages')
    }));
  });
});
