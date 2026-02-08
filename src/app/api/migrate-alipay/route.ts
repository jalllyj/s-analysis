import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * 迁移API路由：为credit_transactions表添加支付宝相关字段
 *
 * 访问地址：http://localhost:5000/api/migrate-alipay
 */
export async function POST() {
  try {
    console.log('开始迁移支付宝字段...');

    // 检查字段是否已存在
    const checkResult = await db.execute(sql`
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

    const addedFields = [];

    for (const field of fieldsToAdd) {
      if (!existingColumns.includes(field.name)) {
        console.log(`添加字段: ${field.name} (${field.type}) - ${field.desc}`);

        await db.execute(sql`
          ALTER TABLE credit_transactions
          ADD COLUMN ${sql.identifier(field.name)} ${sql.raw(field.type)}
        `);

        console.log(`✓ 字段 ${field.name} 添加成功`);
        addedFields.push(field.name);
      } else {
        console.log(`⊘ 字段 ${field.name} 已存在，跳过`);
      }
    }

    return NextResponse.json({
      success: true,
      message: '迁移完成',
      addedFields,
      existingColumns,
    });
  } catch (error) {
    console.error('✗ 迁移失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
