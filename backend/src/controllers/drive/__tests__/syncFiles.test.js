/**
 * Test file for syncFiles controller
 *
 * This demonstrates how to test the functional controllers
 * with dependency injection for easier mocking
 */

// Import Jest functions
import { jest, describe, test, beforeEach, expect } from '@jest/globals';

// Import the controller factory
import { syncFilesController } from '../syncFiles.js';

describe('syncFiles controller', () => {
  // Mock dependencies
  const mockDriveClient = {
    files: {
      list: jest.fn()
    }
  };
  
  const mockGoogleOAuth = {
    getDriveClient: jest.fn()
  };
  
  const mockPrisma = {
    file: {
      findUnique: jest.fn(),
      upsert: jest.fn()
    },
    $transaction: jest.fn(callback => callback(mockPrisma))
  };
  
  // Mock request and response
  const req = {
    user: { userId: 'user123' }
  };
  
  const res = {
    json: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock return values
    mockGoogleOAuth.getDriveClient.mockResolvedValue(mockDriveClient);
    
    mockDriveClient.files.list.mockResolvedValue({
      data: {
        files: [
          {
            id: 'file1',
            name: 'Test File',
            mimeType: 'application/pdf',
            size: '1024',
            modifiedTime: '2025-06-06T12:00:00Z',
            webViewLink: 'https://drive.google.com/file1',
            iconLink: 'https://drive.google.com/icon1',
            thumbnailLink: 'https://drive.google.com/thumbnail1'
          }
        ]
      }
    });
    
    mockPrisma.file.findUnique.mockResolvedValue(null); // File doesn't exist yet
    
    mockPrisma.file.upsert.mockResolvedValue({
      id: 'db1',
      googleId: 'file1',
      name: 'Test File',
      mimeType: 'application/pdf'
    });
  });
  
  test('should sync files successfully', async () => {
    // Create controller with mocked dependencies
    const controller = syncFilesController(mockGoogleOAuth, mockPrisma);
    
    // Call the controller
    await controller(req, res);
    
    // Verify dependencies were called correctly
    expect(mockGoogleOAuth.getDriveClient).toHaveBeenCalledWith('user123');
    
    expect(mockDriveClient.files.list).toHaveBeenCalledWith(expect.objectContaining({
      pageSize: 100,
      fields: expect.any(String),
      orderBy: 'modifiedTime desc'
    }));
    
    expect(mockPrisma.file.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { googleId: 'file1' },
      create: expect.objectContaining({
        googleId: 'file1',
        name: 'Test File',
        userId: 'user123'
      })
    }));
    
    // Verify response
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        message: 'Google Drive files synchronized successfully',
        stats: expect.objectContaining({
          total: 1,
          created: 1,
          updated: 0
        })
      })
    }));
  });
  
  test('should handle authentication errors', async () => {
    // Set up authentication error
    mockGoogleOAuth.getDriveClient.mockResolvedValue(null);
    
    // Create controller with mocked dependencies
    const controller = syncFilesController(mockGoogleOAuth, mockPrisma);
    
    // Mock the error handling
    const next = jest.fn();
    
    // Call the controller with next function for error handling
    await controller(req, { json: res.json }, next).catch(next);
    
    // Verify error was thrown
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      name: 'AuthenticationError',
      message: 'Google Drive authentication required',
      code: 'GOOGLE_AUTH_REQUIRED'
    }));
  });
  
  test('should handle Google Drive API errors', async () => {
    // Set up API error
    mockDriveClient.files.list.mockRejectedValue(new Error('API connection failed'));
    
    // Create controller with mocked dependencies
    const controller = syncFilesController(mockGoogleOAuth, mockPrisma);
    
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
