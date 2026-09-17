const baseUrl = (process.env.APP_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

async function check(path: string, expectedStatus = 200): Promise<void> {
  const response = await fetch(`${baseUrl}${path}`);
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(`${path} returned ${response.status}, expected ${expectedStatus}: ${body.slice(0, 300)}`);
  }
  console.log(`PASS ${path} (${response.status})`);
}

await check('/api/health');
await check('/api/readiness');
await check('/');
console.log(`Smoke tests passed against ${baseUrl}`);
