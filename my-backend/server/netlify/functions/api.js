const serverless = require('serverless-http');
const app = require('../../server/server');

module.exports.handler = serverless(app);

console.log('Netlify function api.js initialized.');