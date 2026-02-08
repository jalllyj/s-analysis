import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function migrateCreditsSystem() {
  console.log('开始迁移积分系统...');

  try {
    // 检查是否已经迁移
    const columnExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'subscriptions'
        AND column_name = 'credits_balance'
      );
    `);

    if (columnExists.rows[0].exists) {
      console.log('积分系统已迁移，跳过');
      return;
    }

    console.log('添加积分相关字段...');

    // 添加积分相关字段
    await db.execute(sql`
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0 NOT NULL;
    `);

    await db.execute(sql`
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS credits_granted INTEGER DEFAULT 0 NOT NULL;
    `);

    // 为现有订阅根据套餐类型初始化积分
    await db.execute(sql`
      UPDATE subscriptions 
      SET 
        credits_balance = CASE plan_type 
          WHEN 'basic' THEN 50 
          WHEN 'pro' THEN 500 
          WHEN 'enterprise' THEN -1 
          ELSE 0 
        END,
        credits_granted = CASE plan_type 
          WHEN 'basic' THEN 50 
          WHEN 'pro' THEN 500 
          WHEN 'enterprise' THEN -1 
          ELSE 0 
        END
      WHERE status = 'active';
    `);

    console.log('添加积分使用记录字段...');

    // 修改使用记录表
    await db.execute(sql`
      ALTER TABLE usage_records 
      ADD COLUMN IF NOT EXISTS used_free_quota INTEGER DEFAULT 0 NOT NULL;
    `);

    await db.execute(sql`
      ALTER TABLE usage_records 
      ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0 NOT NULL;
    `);

    console.log('创建积分交易记录表...');

    // 创建积分交易记录表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        subscription_id INTEGER REFERENCES subscriptions(id),
        amount INTEGER NOT NULL,
        balance INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('积分系统迁移完成！');
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

migrateCreditsSystem()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
