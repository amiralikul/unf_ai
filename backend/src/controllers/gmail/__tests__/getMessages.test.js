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
    email: {
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
    
    mockPrisma.email.findMany.mockResolvedValue([
      {
        id: 'db1',
        google_id: 'msg1',
        subject: 'Test Email 1',
        sender: 'sender1@example.com',
        sender_name: 'Sender One',
        sender_email: 'sender1@example.com',
        recipient: 'recipient@example.com',
        recipient_name: 'Recipient',
        recipient_email: 'recipient@example.com',
        snippet: 'This is a test email',
        received_at: new Date('2025-06-01'),
        is_read: true,
        is_important: false
      },
      {
        id: 'db2',
        google_id: 'msg2',
        subject: 'Test Email 2',
        sender: 'sender2@example.com',
        sender_name: 'Sender Two',
        sender_email: 'sender2@example.com',
        recipient: 'recipient@example.com',
        recipient_name: 'Recipient',
        recipient_email: 'recipient@example.com',
        snippet: 'Another test email',
        received_at: new Date('2025-06-02'),
        is_read: false,
        is_important: true
      }
    ]);
    
    mockPrisma.email.count.mockResolvedValue(2);
  });
  
  test('should get messages successfully', async () => {
    // Create controller with mocked dependencies
    const controller = getMessagesController(mockGoogleOAuth, mockPrisma);

    // Call the controller
    await controller(req, res);

    // Verify dependencies were called correctly
    expect(mockPrisma.email.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { user_id: 'user123' },
      skip: 0,
      take: 10,
      orderBy: { received_at: 'desc' }
    }));

    expect(mockPrisma.email.count).toHaveBeenCalledWith({ where: { user_id: 'user123' } });

    // Verify response
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            id: 'msg1',
            subject: 'Test Email 1'
          }),
          expect.objectContaining({
            id: 'msg2',
            subject: 'Test Email 2'
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
    expect(mockPrisma.email.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        user_id: 'user123',
        is_read: false,
        OR: [
          { subject: { contains: 'important', mode: 'insensitive' } },
          { body: { contains: 'important', mode: 'insensitive' } },
          { sender_name: { contains: 'important', mode: 'insensitive' } },
          { sender_email: { contains: 'important', mode: 'insensitive' } }
        ]
      })
    }));
  });
  
  test('should handle database errors', async () => {
    // Set up database error
    const dbError = new Error('Database connection failed');
    dbError.code = 'P2002'; // Prisma error code
    mockPrisma.email.findMany.mockRejectedValue(dbError);
    
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
