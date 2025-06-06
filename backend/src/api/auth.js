import express from 'express';
import { PrismaClient } from '@prisma/client';
import googleOAuthService from '../services/GoogleOAuthService.js';
import sessionService from '../services/SessionService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to check authentication
export const requireAuth = async (req, res, next) => {
  const { sessionId } = req.cookies;
  
  if (!sessionId) {
    console.log(`🔐 Auth check: no session cookie provided`);
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'NO_TOKEN',
      message: 'No authentication token provided'
    });
  }
  
  console.log(`🔐 Auth check: session=${sessionId.substring(0, 10)}...`);
  
  const session = await sessionService.getSession(sessionId);
  
  if (!session) {
    console.log(`❌ Authentication failed: invalid or expired session`);
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'INVALID_SESSION',
      message: 'Session is invalid or has expired. Please log in again.'
    });
  }
  
  req.user = session;
  console.log(`✅ Authenticated user: ${session.email}`);
  next();
};

// Start Google OAuth flow
router.get('/google', (req, res) => {
  try {
    const authUrl = googleOAuthService.getAuthUrl();
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
    const tokens = await googleOAuthService.getTokens(code);

    // Get user info
    const userInfo = await googleOAuthService.getUserInfo(tokens);
    
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
    const sessionId = await sessionService.createSession({
      userId: user.id,
      email: user.email,
      name: user.name
    });

    // Set session cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // or 'strict'
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Redirect to frontend auth callback route
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?success=true`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?error=auth_failed`);
  }
});

// Logout
router.post('/logout', requireAuth, async (req, res) => {
  const { sessionId } = req.cookies;
  await sessionService.deleteSession(sessionId);
  res.clearCookie('sessionId');
  res.json({ message: 'Logged out successfully' });
});

// Get authentication status and user info
router.get('/status', async (req, res) => {
  const { sessionId } = req.cookies;
  const session = await sessionService.getSession(sessionId);
  
  console.log(`📊 Auth status check: session=${sessionId ? sessionId.substring(0, 10) + '...' : 'none'}, valid=${!!session}`);
  
  if (!session) {
    return res.json({ isAuthenticated: false, user: null });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      // This is a defensive check in case the user was deleted but the session wasn't.
      await sessionService.deleteSession(sessionId);
      res.clearCookie('sessionId');
      return res.json({ isAuthenticated: false, user: null });
    }

    res.json({ 
      isAuthenticated: true,
      user: user
    });

  } catch (error) {
    console.error('Error fetching user in /status endpoint:', error);
    // If we can't fetch the user, treat them as unauthenticated.
    return res.json({ isAuthenticated: false, user: null });
  }
});

export default router; 