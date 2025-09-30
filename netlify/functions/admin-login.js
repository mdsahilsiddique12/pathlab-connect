const { createResponse, createErrorResponse } = require('./utils/response');
const { createSession } = require('./utils/authmiddleware');
const { prisma } = require('./utils/prisma');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'AccessControlAllowOrigin': '*',
        'AccessControlAllowHeaders': 'ContentType',
        'AccessControlAllowMethods': 'POST, OPTIONS'
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
    } else {
     console.log('❌ Invalid credentials for:', email);
     return createErrorResponse(401, 'Invalid credentials');
    }
    // 1) look up the admin row in the database
    const admin = await prisma.admin.findUnique({
      where: { email }
    });
    
    if (!admin) {
      console.log('❌ No admin found for:', email);
      return createErrorResponse(401, 'Invalid credentials');
    }
    
    // 2) verify the password (bcrypt)
    const ok = await require('bcryptjs').compare(password, admin.password);
    if (!ok) {
      console.log('❌ Wrong password for:', email);
      return createErrorResponse(401, 'Invalid credentials');
    }
    
    // 3) create a session that stores the admin’s DB id
    const sessionId = createSession('admin', {
      userId: admin.id,
      email: admin.email,
      role: 'admin',
      loginTime: new Date()
    });
    
    console.log('✅ Admin login successful:', email);
    
    return createResponse(200, {
      success: true,
      sessionId,
      user: { id: admin.id, email: admin.email, role: 'admin' },
      message: 'Login successful'
    });

