// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Import all your existing function handlers (unchanged)
const adminAppointments = require('./netlify/functions/admin-appointments');
const adminDashboard = require('./netlify/functions/admin-dashboard');
const adminLogin = require('./netlify/functions/admin-login');
const adminUpdateStatus = require('./netlify/functions/admin-update-status');
const appointmentsCreate = require('./netlify/functions/appointments-create');
const appointmentsTrack = require('./netlify/functions/appointments-track');
const messaging = require('./netlify/functions/messaging');

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); // For prescription images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (your frontend)
app.use(express.static(path.join(__dirname, 'web')));
app.use(express.static(path.join(__dirname))); // For admin.html in root

// Helper function to convert Netlify function to Express
function netlifyToExpress(netlifyHandler) {
  return async (req, res) => {
    try {
      // Convert Express request to Netlify event format
      const event = {
        httpMethod: req.method,
        path: req.path,
        queryStringParameters: req.query,
        headers: req.headers,
        body: req.body ? JSON.stringify(req.body) : null,
        pathParameters: req.params
      };

      // Call the original Netlify function
      const result = await netlifyHandler.handler(event, {});
      
      // Convert Netlify response to Express response
      if (result.headers) {
        Object.keys(result.headers).forEach(key => {
          res.set(key, result.headers[key]);
        });
      }
      
      res.status(result.statusCode);
      
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
      console.error('Function error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Convert all your Netlify Functions to Express routes
app.post('/api/appointments/create', netlifyToExpress(appointmentsCreate));
app.get('/api/appointments/track/:id', netlifyToExpress(appointmentsTrack));
app.post('/api/admin/login', netlifyToExpress(adminLogin));
app.get('/api/admin/dashboard', netlifyToExpress(adminDashboard));
app.get('/api/admin/appointments', netlifyToExpress(adminAppointments));
app.post('/api/admin/update-status', netlifyToExpress(adminUpdateStatus));
app.post('/api/messaging', netlifyToExpress(messaging));

// Handle OPTIONS requests for CORS
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Serve frontend for any non-API routes
app.get('*', (req, res) => {
  // Check if it's trying to access admin.html
  if (req.path === '/admin' || req.path === '/admin.html') {
    res.sendFile(path.join(__dirname, 'admin.html'));
  } else {
    res.sendFile(path.join(__dirname, 'web/index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 PathLab Connect Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin.html`);
});
