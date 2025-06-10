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
    trelloCard: {
      findMany: jest.fn()
    },
    $transaction: jest.fn(callback => callback(mockPrisma))
  };
  
  const mockLinkDetectionService = {
    extractDriveFileReferences: jest.fn(),
    linkCardToFile: jest.fn()
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
      google_access_token: 'access_token',
      google_refresh_token: 'refresh_token'
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
      google_id: 'file1',
      name: 'Test File',
      mime_type: 'application/pdf'
    });
    
    mockPrisma.trelloCard.findMany.mockResolvedValue([]);
    
    mockLinkDetectionService.extractDriveFileReferences.mockReturnValue([]);
    mockLinkDetectionService.linkCardToFile.mockResolvedValue();
  });
  
  test('should sync files successfully', async () => {
    // Create controller with mocked dependencies
    const controller = syncFilesController(mockGoogleOAuth, mockPrisma, mockLinkDetectionService);
    
    // Call the controller
    await controller(req, res);
    
    // Verify dependencies were called correctly
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user123' },
      select: {
        google_access_token: true,
        google_refresh_token: true
      }
    });
    
    expect(mockGoogleOAuth.getDriveFiles).toHaveBeenCalledWith({
      access_token: 'access_token',
      refresh_token: 'refresh_token'
    }, 100);
    
    expect(mockPrisma.file.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { google_id: 'file1' },
      create: expect.objectContaining({
        google_id: 'file1',
        name: 'Test File',
        user_id: 'user123',
        owners: expect.any(Array)
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
    const controller = syncFilesController(mockGoogleOAuth, mockPrisma, mockLinkDetectionService);
    
    // Mock the error handling
    const next = jest.fn();
    
    // Call the controller and expect it to throw an error
    await expect(controller(req, res, next)).rejects.toThrow('Google Drive authentication required');
  });
  
  test('should handle Google Drive API errors', async () => {
    // Set up API error
    mockGoogleOAuth.getDriveFiles.mockRejectedValue(new Error('API connection failed'));
    
    // Create controller with mocked dependencies
    const controller = syncFilesController(mockGoogleOAuth, mockPrisma, mockLinkDetectionService);
    
    // Call the controller and expect it to throw an ExternalServiceError
    await expect(controller(req, res)).rejects.toThrow();
  });
  
  test('should handle missing tokens', async () => {
    // Set up user without tokens
    mockPrisma.user.findUnique.mockResolvedValue({
      google_access_token: null,
      google_refresh_token: null
    });
    
    // Create controller with mocked dependencies
    const controller = syncFilesController(mockGoogleOAuth, mockPrisma, mockLinkDetectionService);
    
    // Call the controller and expect it to throw an error
    await expect(controller(req, res)).rejects.toThrow('Google Drive authentication required');
  });
});
