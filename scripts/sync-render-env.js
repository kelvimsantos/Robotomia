import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(projectRoot, '.env');
const { error } = dotenv.config({ path: envPath });

if (error) {
  throw new Error(`Could not load ${envPath}: ${error.message}`);
}

const apiKey = process.env.RENDER_API_KEY;
const serviceId = process.env.RENDER_SERVICE_ID;
const variables = ['MONGO_URI', 'GROQ_API_KEY'].map((key) => ({
  key,
  value: process.env[key],
}));
const missing = [
  ...(!apiKey ? ['RENDER_API_KEY'] : []),
  ...(!serviceId ? ['RENDER_SERVICE_ID'] : []),
  ...variables.filter(({ value }) => !value).map(({ key }) => key),
];

if (missing.length > 0) {
  throw new Error(`Missing required values in .env: ${missing.join(', ')}`);
}

for (const { key, value } of variables) {
  const url = new URL(
    `/v1/services/${encodeURIComponent(serviceId)}/env-vars/${encodeURIComponent(key)}`,
    'https://api.render.com',
  );
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value }),
  });

  if (!response.ok) {
    throw new Error(`Render rejected ${key} (HTTP ${response.status}).`);
  }

  console.log(`${key} synced to Render.`);
}
