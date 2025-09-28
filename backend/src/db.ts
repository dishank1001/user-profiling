import { createPool } from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

export const pool = createPool({
    uri: DATABASE_URL,
    connectionLimit: 10,
});

// Simple query helper
export async function query<T = any>(sql: string, params: any[] = []) {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

// Health check: SELECT 1
export async function ping(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('DB ping failed:', err);
    return false;
  }
}
