function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: statusCode < 400,
      data: data
    })
  };
}

function createErrorResponse(statusCode, message) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: false,
      message: message
    })
  };
}

module.exports = {
  createResponse,
  createErrorResponse
};
