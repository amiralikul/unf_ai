import crypto from 'crypto';

// Database-backed session store (survives server restarts)
export class SessionService {
  constructor(prisma) {
    this.prisma = prisma;
    
    // Start automatic cleanup every 30 minutes
    this.startCleanupInterval();
  }

  // Generate session ID
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create session
  async createSession(userData) {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      await this.prisma.session.create({
        data: {
          session_id: sessionId,
          user_id: userData.userId,
          email: userData.email,
          name: userData.name,
          expires_at: expiresAt,
        }
      });

      console.log(`📝 Created database session ${sessionId.substring(0, 10)}... for user ${userData.email}`);
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Get session
  async getSession(sessionId) {
    if (!sessionId) return null;

    try {
      const session = await this.prisma.session.findUnique({
        where: { session_id: sessionId },
        include: { user: true }
      });

      if (!session) return null;

      // Check if session is expired
      if (session.expires_at < new Date()) {
        console.log(`⏰ Session expired: ${sessionId.substring(0, 10)}...`);
        await this.deleteSession(sessionId);
        return null;
      }

      // Update last accessed time
      await this.prisma.session.update({
        where: { session_id: sessionId },
        data: { last_accessed: new Date() }
      });

      return {
        userId: session.user_id,
        email: session.email,
        name: session.name,
        createdAt: session.created_at,
        lastAccessed: new Date()
      };
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // Delete session
  async deleteSession(sessionId) {
    if (!sessionId) return false;

    try {
      await this.prisma.session.delete({
        where: { session_id: sessionId }
      });
      console.log(`🗑️ Deleted session ${sessionId.substring(0, 10)}...`);
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  // Check if session exists
  async hasSession(sessionId) {
    if (!sessionId) return false;

    try {
      const session = await this.prisma.session.findUnique({
        where: { session_id: sessionId },
        select: { id: true, expires_at: true }
      });

      if (!session) return false;
      
      // Check if expired
      if (session.expires_at < new Date()) {
        await this.deleteSession(sessionId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  }

  // Get session count
  async getSessionCount() {
    try {
      return await this.prisma.session.count({
        where: {
          expires_at: { gt: new Date() } // Only count non-expired sessions
        }
      });
    } catch (error) {
      console.error('Error getting session count:', error);
      return 0;
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions() {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          expires_at: { lt: new Date() }
        }
      });

      if (result.count > 0) {
        console.log(`🧹 Cleaned up ${result.count} expired sessions from database`);
      }

      return result.count;
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      return 0;
    }
  }

  // Start periodic cleanup of expired sessions
  startCleanupInterval() {
    setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, 30 * 60 * 1000); // 30 minutes
  }

  // Clean shutdown
  async shutdown() {
    await this.prisma.$disconnect();
  }
} 