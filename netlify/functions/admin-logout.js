const { createResponse, createErrorResponse } = require('../utils/response');
const { destroySession } = require('../utils/auth-middleware');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method not allowed');
  }

  try {
    const sessionId = event.headers['x-session-id'];
    
    if (sessionId && destroySession(sessionId)) {
      console.log('✅ User logged out successfully');
      return createResponse(200, {
        success: true,
        message: 'Logged out successfully'
      });
    }

    return createResponse(200, {
      success: true,
      message: 'Session already expired'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    return createErrorResponse(500, 'Logout failed');
  }
};
