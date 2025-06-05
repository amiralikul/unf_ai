import express from 'express';
import { PrismaClient } from '@prisma/client';
import GoogleOAuthService from '../services/GoogleOAuthService.js';
import sessionService from '../services/SessionService.js';

const router = express.Router();
const prisma = new PrismaClient();
const googleOAuth = new GoogleOAuthService();

// Middleware to check authentication
export const requireAuth = (req, res, next) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  console.log(`🔐 Auth check: session=${sessionId ? sessionId.substring(0, 10) + '...' : 'none'}`);
  
  const session = sessionService.getSession(sessionId);
  
  if (!session) {
    console.log(`❌ Authentication failed: invalid session`);
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  req.user = session;
  console.log(`✅ Authenticated user: ${session.email}`);
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
    const sessionId = sessionService.createSession({
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
  sessionService.deleteSession(sessionId);
  res.json({ message: 'Logged out successfully' });
});

// Get authentication status
router.get('/status', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = sessionService.getSession(sessionId);
  
  console.log(`📊 Auth status check: session=${sessionId ? sessionId.substring(0, 10) + '...' : 'none'}, valid=${!!session}`);
  
  res.json({ 
    isAuthenticated: !!session,
    user: session || null 
  });
});

export default router; 