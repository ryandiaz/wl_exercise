const serverless = require('serverless-http');
const app = require('./index.js');

// Create the serverless handler
const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // Add CORS headers for all responses
  const result = await handler(event, context);
  
  if (result.headers) {
    result.headers['Access-Control-Allow-Origin'] = '*';
    result.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    result.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }
  
  return result;
}; 