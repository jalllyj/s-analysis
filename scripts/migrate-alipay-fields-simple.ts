import { pg } from 'coze-coding-dev-sdk';

/**
 * 迁移脚本：为credit_transactions表添加支付宝相关字段
 *
 * 执行命令：npx tsx scripts/migrate-alipay-fields-simple.ts
 */

async function migrateAlipayFields() {
  try {
    console.log('开始迁移支付宝字段...');

    // 获取数据库连接
    const db = await pg.getClient();

    // 检查字段是否已存在
    const checkResult = await db.execute(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'credit_transactions'
      AND column_name IN ('transaction_id', 'credits', 'status', 'payment_method', 'trade_no', 'buyer_id', 'completed_at', 'updated_at')
    `);

    const existingColumns = (checkResult.rows || []).map((row: any) => row.column_name);

    console.log('已存在的字段:', existingColumns);

    // 添加不存在的字段
    const fieldsToAdd = [
      { name: 'transaction_id', type: 'VARCHAR(255) UNIQUE', desc: '商户订单号' },
      { name: 'credits', type: 'INTEGER', desc: '积分数量' },
      { name: 'status', type: 'VARCHAR(20) DEFAULT \'completed\'', desc: '订单状态' },
      { name: 'payment_method', type: 'VARCHAR(50)', desc: '支付方式' },
      { name: 'trade_no', type: 'VARCHAR(255)', desc: '支付宝交易号' },
      { name: 'buyer_id', type: 'VARCHAR(255)', desc: '买家ID' },
      { name: 'completed_at', type: 'TIMESTAMP', desc: '完成时间' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()', desc: '更新时间' },
    ];

    for (const field of fieldsToAdd) {
      if (!existingColumns.includes(field.name)) {
        console.log(`添加字段: ${field.name} (${field.type}) - ${field.desc}`);

        await db.execute(`
          ALTER TABLE credit_transactions
          ADD COLUMN "${field.name}" ${field.type}
        `);

        console.log(`✓ 字段 ${field.name} 添加成功`);
      } else {
        console.log(`⊘ 字段 ${field.name} 已存在，跳过`);
      }
    }

    console.log('✓ 支付宝字段迁移完成');
  } catch (error) {
    console.error('✗ 迁移失败:', error);
    process.exit(1);
  }
}

// 执行迁移
migrateAlipayFields().then(() => {
  console.log('迁移脚本执行完成');
  process.exit(0);
});
