import { getDb } from 'coze-coding-dev-sdk';
import * as schema from '../src/storage/database/shared/schema.ts';
import { sql } from 'drizzle-orm';

async function createTopupRequestsTable() {
  const db = await getDb(schema);

  try {
    // 创建充值请求表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS topup_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        email VARCHAR(255) NOT NULL,
        tier_id VARCHAR(100) NOT NULL,
        tier_name VARCHAR(100) NOT NULL,
        credits INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        receipt_file_key VARCHAR(500),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        admin_id INTEGER REFERENCES users(id),
        admin_remark TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 创建索引
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_topup_requests_user_id ON topup_requests(user_id);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_topup_requests_status ON topup_requests(status);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_topup_requests_created_at ON topup_requests(created_at DESC);
    `);

    console.log('✅ 充值请求表创建成功');
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建表失败:', error);
    process.exit(1);
  }
}

createTopupRequestsTable();
