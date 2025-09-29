const { createResponse, createErrorResponse } = require('./utils/response');
const { createSession } = require('./utils/auth-middleware');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method not allowed');
  }

  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return createErrorResponse(400, 'Email and password required');
    }

    console.log('🔐 Login attempt:', email);

    // Check credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'mdsahilsiddique12@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (email === adminEmail && password === adminPassword) {
      // Create new session
      const sessionId = createSession('admin', {
        email: adminEmail,
        role: 'admin',
        loginTime: new Date()
      });

      console.log('✅ Admin login successful:', email);

      return createResponse(200, {
        success: true,
        sessionId: sessionId,
        user: {
          email: adminEmail,
          role: 'admin'
        },
        message: 'Login successful'
      });

    } else {
      console.log('❌ Invalid credentials for:', email);
      return createErrorResponse(401, 'Invalid credentials');
    }

  } catch (error) {
    console.error('❌ Login error:', error);
    return createErrorResponse(500, 'Login failed');
  }
};
