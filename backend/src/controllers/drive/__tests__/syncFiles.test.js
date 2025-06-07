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
  const mockGoogleOAuth = {
    getDriveFiles: jest.fn()
  };
  
  const mockPrisma = {
    user: {
      findUnique: jest.fn()
    },
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
    mockPrisma.user.findUnique.mockResolvedValue({
      googleAccessToken: 'access_token',
      googleRefreshToken: 'refresh_token'
    });
    
    mockGoogleOAuth.getDriveFiles.mockResolvedValue([
      {
        id: 'file1',
        name: 'Test File',
        mimeType: 'application/pdf',
        size: '1024',
        modifiedTime: '2025-06-06T12:00:00Z',
        webViewLink: 'https://drive.google.com/file1',
        owners: [{ emailAddress: 'user@example.com' }]
      }
    ]);
    
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
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user123' },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true
      }
    });
    
    expect(mockGoogleOAuth.getDriveFiles).toHaveBeenCalledWith({
      access_token: 'access_token',
      refresh_token: 'refresh_token'
    }, 100);
    
    expect(mockPrisma.file.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { googleId: 'file1' },
      create: expect.objectContaining({
        googleId: 'file1',
        name: 'Test File',
        userId: 'user123',
        owners: expect.any(String)
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
    // Set up authentication error - no user found
    mockPrisma.user.findUnique.mockResolvedValue(null);
    
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
    mockGoogleOAuth.getDriveFiles.mockRejectedValue(new Error('API connection failed'));
    
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
  
  test('should handle missing tokens', async () => {
    // Set up user without tokens
    mockPrisma.user.findUnique.mockResolvedValue({
      googleAccessToken: null,
      googleRefreshToken: null
    });
    
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
});
