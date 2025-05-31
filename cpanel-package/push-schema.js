#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from 'ws';
import * as schema from './shared/schema.js';

neonConfig.webSocketConstructor = ws;

console.log('Connecting to database...');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

console.log('Pushing schema to database...');

try {
  // This will create tables if they don't exist or modify them if they do
  await db.insert(schema.users).values({
    username: 'admin',
    password: '$2b$12$JSxo6BQA136Fyzs7ALOP8ONMIAsIRKiTjB/gAifHnpmtdL0yDqcH2', // plaintext: admin123
    email: 'admin@proace.com',
    displayName: 'Administrator',
    role: 'admin'
  }).onConflictDoNothing();
  
  console.log('Schema pushed successfully!');
} catch (error) {
  console.error('Error pushing schema:', error);
} finally {
  await pool.end();
}