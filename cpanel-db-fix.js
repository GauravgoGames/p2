// Database configuration fix for cPanel PostgreSQL
import 'dotenv/config';
import { Pool } from 'pg';

async function testDatabaseConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result.rows[0].current_time);
    
    // Test if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 Existing tables:', tablesResult.rows.map(r => r.table_name));
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found. You may need to run database migrations.');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Database URL:', process.env.DATABASE_URL);
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();