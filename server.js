// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('web')); // or wherever your built frontend is
app.use(express.json());

// Convert your Netlify Functions to Express routes here
// For example:
// app.post('/api/booking', require('./netlify/functions/booking'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
