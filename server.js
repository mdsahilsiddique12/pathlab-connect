// server.js - Complete PathLab Connect Server
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting PathLab Connect Server...');
console.log('📍 PORT:', PORT);
console.log('📍 NODE_ENV:', process.env.NODE_ENV);
console.log('📍 Environment Check:');
console.log('  DATABASE_URL:', !!process.env.DATABASE_URL);
console.log('  DIRECT_URL:', !!process.env.DIRECT_URL);  
console.log('  JWT_SECRET:', !!process.env.JWT_SECRET);
console.log('  WHATSAPP_TOKEN:', !!process.env.WHATSAPP_TOKEN);

// Import all your existing function handlers (with error handling)
let adminAppointments, adminDashboard, adminLogin, adminUpdateStatus;
let appointmentsCreate, appointmentsTrack, messaging;

try {
  adminAppointments = require('./netlify/functions/admin-appointments');
  adminDashboard = require('./netlify/functions/admin-dashboard');
  adminLogin = require('./netlify/functions/admin-login');
  adminUpdateStatus = require('./netlify/functions/admin-update-status');
  appointmentsCreate = require('./netlify/functions/appointments-create');
  appointmentsTrack = require('./netlify/functions/appointments-track');
  
  // Only import messaging if it exists
  try {
    messaging = require('./netlify/functions/utile/messaging');
  } catch (e) {
    console.log('⚠️ Messaging function not found, skipping');
  }
  
  console.log('✅ All function handlers loaded successfully');
} catch (error) {
  console.error('❌ Error loading function handlers:', error.message);
}

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' })); // For prescription images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use('/web', express.static(path.join(__dirname, 'web')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIRECT_URL: !!process.env.DIRECT_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      WHATSAPP_TOKEN: !!process.env.WHATSAPP_TOKEN
    }
  });
});

// Helper function to convert Netlify function to Express
function netlifyToExpress(netlifyHandler) {
  return async (req, res) => {
    try {
      if (!netlifyHandler || !netlifyHandler.handler) {
        console.error('❌ Handler not found or invalid');
        return res.status(500).json({ error: 'Function handler not available' });
      }

      console.log(`📡 ${req.method} ${req.path} - Processing request`);
      
      // Convert Express request to Netlify event format
      const event = {
        httpMethod: req.method,
        path: req.path,
        queryStringParameters: req.query || {},
        headers: req.headers || {},
        body: req.body ? JSON.stringify(req.body) : null,
        pathParameters: req.params || {}
      };

      // Call the original Netlify function
      const result = await netlifyHandler.handler(event, {});
      
      console.log(`📤 Response status: ${result.statusCode}`);
      
      // Set headers
      if (result.headers) {
        Object.keys(result.headers).forEach(key => {
          res.set(key, result.headers[key]);
        });
      }
      
      // Set status and send response
      res.status(result.statusCode || 200);
      
      if (result.body) {
        try {
          const jsonBody = JSON.parse(result.body);
          res.json(jsonBody);
        } catch {
          res.send(result.body);
        }
      } else {
        res.end();
      }
    } catch (error) {
      console.error(`❌ Function error (${req.method} ${req.path}):`, error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error.message,
        path: req.path,
        method: req.method
      });
    }
  };
}

// API Routes - Convert all your Netlify Functions to Express routes
if (appointmentsCreate) {
  app.post('/api/appointments/create', netlifyToExpress(appointmentsCreate));
}

if (appointmentsTrack) {
  app.get('/api/appointments/track/:id', netlifyToExpress(appointmentsTrack));
}

if (adminLogin) {
  app.post('/api/admin/login', netlifyToExpress(adminLogin));
}

if (adminDashboard) {
  app.get('/api/admin/dashboard', netlifyToExpress(adminDashboard));
}

if (adminAppointments) {
  app.get('/api/admin/appointments', netlifyToExpress(adminAppointments));
}

if (adminUpdateStatus) {
  app.post('/api/admin/update-status', netlifyToExpress(adminUpdateStatus));
}

if (messaging) {
  app.post('/api/messaging', netlifyToExpress(messaging));
}

// Test endpoints for debugging
app.get('/api/test', (req, res) => {
  console.log('📨 Test API endpoint called');
  res.json({ 
    success: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'POST /api/appointments/create',
      'GET /api/appointments/track/:id',
      'POST /api/admin/login',
      'GET /api/admin/dashboard',
      'GET /api/admin/appointments',
      'POST /api/admin/update-status',
      messaging ? 'POST /api/messaging' : 'POST /api/messaging (not loaded)'
    ]
  });
});

// Handle OPTIONS requests for CORS
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Serve admin panel and frontend
app.get('/admin', (req, res) => {
  res.redirect('/admin.html');
});

// Root route and frontend serving
app.get('*', (req, res) => {
  try {
    // Check if it's trying to access admin.html
    if (req.path === '/admin.html') {
      const adminPath = path.join(__dirname, 'admin.html');
      if (fs.existsSync(adminPath)) {
        return res.sendFile(adminPath);
      } else {
        return res.status(404).send('<h1>Admin panel not found</h1><p>admin.html file is missing</p>');
      }
    }
    
    // Try to serve from web folder
    const frontendPath = path.join(__dirname, 'web', req.path === '/' ? 'index.html' : req.path);
    if (fs.existsSync(frontendPath)) {
      return res.sendFile(frontendPath);
    }
    
    // Default response for root
    if (req.path === '/') {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PathLab Connect API</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
            .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
            .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
            ul li { margin: 5px 0; }
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>🚀 PathLab Connect API Server</h1>
          
          <div class="status success">
            <strong>✅ Server Status:</strong> Running on port ${PORT}
          </div>
          
          <div class="status info">
            <strong>🔧 Environment Variables:</strong>
            <ul>
              <li>DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}</li>
              <li>DIRECT_URL: ${process.env.DIRECT_URL ? '✅ Set' : '❌ Missing'}</li>
              <li>JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}</li>
              <li>WHATSAPP_TOKEN: ${process.env.WHATSAPP_TOKEN ? '✅ Set' : '❌ Missing'}</li>
            </ul>
          </div>
          
          <div class="status info">
            <strong>📡 Available API Endpoints:</strong>
            <ul>
              <li><a href="/health">GET /health</a> - Health check</li>
              <li><a href="/api/test">GET /api/test</a> - Test endpoint</li>
              <li>POST /api/appointments/create - Create appointment</li>
              <li>GET /api/appointments/track/:id - Track appointment</li>
              <li>POST /api/admin/login - Admin login</li>
              <li>GET /api/admin/dashboard - Admin dashboard</li>
              <li>GET /api/admin/appointments - Admin appointments</li>
              <li>POST /api/admin/update-status - Update appointment status</li>
              ${messaging ? '<li>POST /api/messaging - Send messages</li>' : '<li>POST /api/messaging - ⚠️ Not loaded</li>'}
            </ul>
          </div>
          
          <div class="status info">
            <strong>🎛️ Admin Panel:</strong>
            <p><a href="/admin.html">👨‍💼 Access Admin Panel</a></p>
          </div>
          
          <div class="status warning">
            <strong>📝 Note:</strong> Frontend files are served from /web/ directory if available.
          </div>
        </body>
        </html>
      `);
    }
    
    // 404 for other paths
    res.status(404).send(`
      <h1>404 - Not Found</h1>
      <p>The requested path "${req.path}" was not found.</p>
      <p><a href="/">← Go back to home</a></p>
    `);
    
  } catch (error) {
    console.error('❌ Route handler error:', error);
    res.status(500).send(`
      <h1>500 - Server Error</h1>
      <p>An error occurred: ${error.message}</p>
      <p><a href="/">← Go back to home</a></p>
    `);
  }
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Global Error Handler:', error);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    details: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎉 ================================================');
  console.log(`🚀 PathLab Connect Server STARTED successfully!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
  console.log(`🎛️ Admin: http://localhost:${PORT}/admin.html`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  console.log('🎉 ================================================');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('🔴 Process terminated');
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

console.log('✅ Server setup complete, waiting for connections...');
