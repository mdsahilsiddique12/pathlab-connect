const { createResponse } = require('./utils/response');

exports.handler = async (event, _context) => {
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

  return createResponse(200, {
    success: true,
    message: 'Logout endpoint disabled – no authentication in use'
  });
};
