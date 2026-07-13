const http = require('http');

// URL of the deployed backend server (change to your Render/Railway production URL)
const BACKEND_URL = process.env.PRODUCTION_BACKEND_URL || 'http://localhost:5000/api/v1/keep-alive';

console.log(`====================================================`);
console.log(`MS-Forge Keep-Alive Daemon Started`);
console.log(`Pinging destination: ${BACKEND_URL}`);
console.log(`Interval: Every 10 minutes`);
console.log(`====================================================`);

// Self-scheduling heartbeat function
function pingServer() {
  console.log(`[${new Date().toISOString()}] Sending keep-alive heartbeat...`);
  
  http.get(BACKEND_URL, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`[${new Date().toISOString()}] Heartbeat response (${res.statusCode}): ${data.trim()}`);
    });
  }).on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Heartbeat failed:`, err.message);
  });
}

// Ping immediately on start, then every 10 minutes
pingServer();
setInterval(pingServer, 10 * 60 * 1000);
