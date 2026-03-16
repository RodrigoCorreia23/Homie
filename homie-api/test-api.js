// Run: node test-api.js
const http = require('http');

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`\n${method} ${path} → ${res.statusCode}`);
        try { console.log(JSON.stringify(JSON.parse(body), null, 2)); }
        catch { console.log(body); }
        resolve({ status: res.statusCode, data: JSON.parse(body) });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  // 1. Health check
  await request('GET', '/api/health');

  // 2. Login
  const login = await request('POST', '/api/auth/login', {
    email: 'ana@example.com',
    password: 'password123',
  });

  if (!login.data.accessToken) {
    console.log('\nLogin failed, stopping tests.');
    return;
  }

  const token = login.data.accessToken;

  // 3. Get profile
  await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 3001,
      path: '/api/users/me', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`\nGET /api/users/me → ${res.statusCode}`);
        console.log(JSON.stringify(JSON.parse(body), null, 2));
        resolve();
      });
    });
    req.on('error', reject);
    req.end();
  });

  // 4. Get listings feed
  await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 3001,
      path: '/api/listings?city=Lisboa', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`\nGET /api/listings?city=Lisboa → ${res.statusCode}`);
        console.log(JSON.stringify(JSON.parse(body), null, 2));
        resolve();
      });
    });
    req.on('error', reject);
    req.end();
  });

  // 5. Get favorites
  await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 3001,
      path: '/api/favorites', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`\nGET /api/favorites → ${res.statusCode}`);
        console.log(JSON.stringify(JSON.parse(body), null, 2));
        resolve();
      });
    });
    req.on('error', reject);
    req.end();
  });

  console.log('\n✅ All tests completed!');
}

run().catch(console.error);
