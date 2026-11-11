import nextEnv from '@next/env';
import pg from 'pg';
import { POST } from '../src/app/api/projects/[id]/reschedule-suggestion/route.ts';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testApiRoute() {
  const p = await pool.query("SELECT id, name FROM projects WHERE name = 'Identidad Café Norte'");
  const projectId = p.rows[0]?.id;
  console.log('Project ID:', projectId);

  const req = new Request(`http://localhost:3000/api/projects/${projectId}/reschedule-suggestion?language=es`, {
    method: 'POST'
  });

  const res = await POST(req, {
    params: Promise.resolve({ id: projectId })
  });

  const data = await res.json();
  console.log('Response status:', res.status);
  console.log('Response JSON:', JSON.stringify(data, null, 2));

  await pool.end();
}

testApiRoute();
