// In-memory session store (use Redis for production)
const sessions = new Map();

const createSession = (userId, userData = {}) => {
  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2);
  
  sessions.set(sessionId, {
    id: sessionId,
    userId,
    userData,
    createdAt: new Date(),
    lastAccessed: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });
  
  console.log(`✅ Session created: ${sessionId} for user: ${userId}`);
  return sessionId;
};

const validateSession = (sessionId) => {
  if (!sessionId) {
    console.log('❌ No session ID provided');
    return null;
  }

  const session = sessions.get(sessionId);
  
  if (!session) {
    console.log('❌ Session not found:', sessionId.substring(0, 10));
    return null;
  }

  if (new Date() > session.expiresAt) {
    console.log('❌ Session expired:', sessionId.substring(0, 10));
    sessions.delete(sessionId);
    return null;
  }

  // Update last accessed
  session.lastAccessed = new Date();
  console.log('✅ Session valid:', sessionId.substring(0, 10));
  
  return session;
};

const destroySession = (sessionId) => {
  if (sessions.has(sessionId)) {
    sessions.delete(sessionId);
    console.log('✅ Session destroyed:', sessionId.substring(0, 10));
    return true;
  }
  return false;
};

const cleanupExpiredSessions = () => {
  const now = new Date();
  let cleaned = 0;
  
  for (const [sessionId, session] of sessions) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
  }
};

// Cleanup expired sessions every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
  createSession,
  validateSession,
  destroySession,
  cleanupExpiredSessions
};
