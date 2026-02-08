import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions, creditTransactions } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

// 管理员密钥（简单验证，生产环境应该使用更安全的认证方式）
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin_secret_key';

export async function POST(request: NextRequest) {
  try {
    // 验证管理员身份
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: '未授权，需要管理员权限' },
        { status: 403 }
      );
    }

    const { email, credits, description } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: '请提供用户邮箱' },
        { status: 400 }
      );
    }

    if (!credits || credits <= 0) {
      return NextResponse.json(
        { error: '请提供有效的积分数量' },
        { status: 400 }
      );
    }

    // 查找用户
    const userResult = await db.execute(`
      SELECT id FROM users WHERE email = '${email}' LIMIT 1
    `);

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const userId = Number(userResult.rows[0].id);

    // 获取用户订阅信息
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription) {
      return NextResponse.json(
        { error: '未找到订阅信息' },
        { status: 404 }
      );
    }

    // 生成订单号
    const outTradeNo = `ADMIN_${userId}_${Date.now()}`;

    // 增加积分
    await db.update(subscriptions)
      .set({
        creditsBalance: subscription.creditsBalance + credits,
        creditsGranted: subscription.creditsGranted + credits,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));

    // 记录积分交易
    await db.insert(creditTransactions).values({
      userId: userId,
      subscriptionId: subscription.id,
      transactionId: outTradeNo,
      amount: 0,
      balance: subscription.creditsBalance + credits,
      credits: credits,
      type: 'grant',
      description: description || `管理员手动充值（${credits}积分）`,
      status: 'completed',
      paymentMethod: 'admin',
    });

    return NextResponse.json({
      message: '充值成功',
      userId: userId,
      creditsAdded: credits,
      newBalance: subscription.creditsBalance + credits,
    });
  } catch (error) {
    console.error('管理员充值失败:', error);
    return NextResponse.json(
      { error: '充值失败，请稍后重试' },
      { status: 500 }
    );
  }
}
