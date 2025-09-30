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




      return createResponse(200, { success: true, message: 'Login no longer required' });

  } catch (error) {
    console.error('❌ Login error:', error);
    return createErrorResponse(500, 'Login failed');
  }
};
