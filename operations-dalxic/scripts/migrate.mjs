import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const file = process.argv[2] || 'prisma/migrations/002_returns.sql';
const content = fs.readFileSync(file, 'utf-8');

try {
  await pool.query(content);
  console.log('Migration applied successfully.');
} catch (e) {
  console.error('Migration failed:', e.message);
}
await pool.end();
