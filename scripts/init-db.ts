import { db } from '../src/lib/db';
import { users, subscriptions, usageRecords, paymentRecords } from '../src/lib/db/schema';
import * as schema from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function initDatabase() {
  console.log('开始初始化数据库...');

  try {
    // 检查表是否存在
    const tablesExist = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (tablesExist.rows[0].exists) {
      console.log('数据库表已存在，跳过创建');
      return;
    }

    // 创建表
    console.log('创建users表...');
    await db.execute(sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('创建subscriptions表...');
    await db.execute(sql`
      CREATE TABLE subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan_type TEXT NOT NULL,
        status TEXT NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        monthly_quota INTEGER NOT NULL,
        stripe_subscription_id TEXT,
        stripe_customer_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('创建usage_records表...');
    await db.execute(sql`
      CREATE TABLE usage_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        subscription_id INTEGER REFERENCES subscriptions(id),
        stocks_analyzed INTEGER NOT NULL,
        used_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('创建payment_records表...');
    await db.execute(sql`
      CREATE TABLE payment_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        subscription_id INTEGER REFERENCES subscriptions(id),
        amount DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'CNY',
        stripe_payment_id TEXT,
        status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

initDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
