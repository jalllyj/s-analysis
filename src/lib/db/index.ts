import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const { Pool } = pg;

// 创建PostgreSQL连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 创建Drizzle实例
export const db = drizzle(pool);

export default db;
