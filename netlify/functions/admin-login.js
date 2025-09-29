const { createResponse, createErrorResponse } = require('./utils/response');

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

    console.log('Admin login attempt:', email);

    // Check credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'mdsahilsiddique12@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Sahiladil@123';

    if (email === adminEmail && password === adminPassword) {
      // Simple token (no JWT) - matches what admin.html expects
      const token = 'admin-session-' + Date.now() + '-' + Math.random().toString(36).substring(2);

      console.log('✅ Admin login successful:', email);

      return createResponse(200, {
        success: true,
        data: {
          token,
          user: { 
            email: adminEmail, 
            name: 'Admin', 
            role: 'admin' 
          }
        }
      });
    } else {
      console.log('❌ Admin login failed - invalid credentials:', email);
      return createErrorResponse(401, 'Invalid credentials');
    }

  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse(500, 'Login failed');
  }
};
