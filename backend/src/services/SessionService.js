// Simple in-memory session store (use Redis in production)
class SessionService {
  constructor() {
    this.sessions = new Map();
  }

  // Generate session ID
  generateSessionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Create session
  createSession(userData) {
    const sessionId = this.generateSessionId();
    this.sessions.set(sessionId, {
      ...userData,
      createdAt: new Date(),
      lastAccessed: new Date()
    });
    console.log(`📝 Created session ${sessionId.substring(0, 10)}... for user ${userData.email}`);
    return sessionId;
  }

  // Get session
  getSession(sessionId) {
    if (!sessionId) return null;
    
    const session = this.sessions.get(sessionId);
    if (session) {
      // Update last accessed time
      session.lastAccessed = new Date();
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  // Delete session
  deleteSession(sessionId) {
    if (!sessionId) return false;
    
    const existed = this.sessions.has(sessionId);
    this.sessions.delete(sessionId);
    console.log(`🗑️ Deleted session ${sessionId.substring(0, 10)}...`);
    return existed;
  }

  // Check if session exists
  hasSession(sessionId) {
    return sessionId && this.sessions.has(sessionId);
  }

  // Get session count
  getSessionCount() {
    return this.sessions.size;
  }

  // Clean up old sessions (optional)
  cleanupExpiredSessions(maxAgeHours = 24) {
    const now = new Date();
    const expiredSessions = [];
    
    for (const [sessionId, session] of this.sessions.entries()) {
      const ageHours = (now - session.lastAccessed) / (1000 * 60 * 60);
      if (ageHours > maxAgeHours) {
        expiredSessions.push(sessionId);
      }
    }
    
    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
    });
    
    if (expiredSessions.length > 0) {
      console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
    }
    
    return expiredSessions.length;
  }
}

// Create singleton instance
const sessionService = new SessionService();

export default sessionService; 