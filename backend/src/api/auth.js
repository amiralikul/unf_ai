import express from 'express';
import { PrismaClient } from '@prisma/client';
import GoogleOAuthService from '../services/GoogleOAuthService.js';

const router = express.Router();
const prisma = new PrismaClient();
const googleOAuth = new GoogleOAuthService();

// Session middleware (simple in-memory session for development)
const sessions = new Map();

// Generate session ID
const generateSessionId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Middleware to check authentication
export const requireAuth = (req, res, next) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  req.user = sessions.get(sessionId);
  next();
};

// Start Google OAuth flow
router.get('/google', (req, res) => {
  try {
    const authUrl = googleOAuth.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
});

// Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    // Exchange code for tokens
    const tokens = await googleOAuth.getTokens(code);
    
    // Get user info
    const userInfo = await googleOAuth.getUserInfo(tokens);
    
    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
        }
      });
    } else {
      // Update tokens
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
        }
      });
    }

    // Create session
    const sessionId = generateSessionId();
    sessions.set(sessionId, {
      userId: user.id,
      email: user.email,
      name: user.name
    });

    // Redirect to frontend with session token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?token=${sessionId}&success=true`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?error=auth_failed`);
  }
});

// Get current user info
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});

// Logout
router.post('/logout', requireAuth, (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  sessions.delete(sessionId);
  res.json({ message: 'Logged out successfully' });
});

// Get authentication status
router.get('/status', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const isAuthenticated = sessionId && sessions.has(sessionId);
  
  res.json({ 
    isAuthenticated,
    user: isAuthenticated ? sessions.get(sessionId) : null 
  });
});

export default router; 