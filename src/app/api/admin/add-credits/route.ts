import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions, creditTransactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken, parseAuthHeader } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const token = parseAuthHeader(request);
    if (!token) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: '无效的token' },
        { status: 401 }
      );
    }

    const { amount, description } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: '请输入有效的积分数量' },
        { status: 400 }
      );
    }

    // 获取用户订阅信息
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, payload.userId))
      .limit(1);

    if (!subscription) {
      return NextResponse.json(
        { error: '未找到订阅信息' },
        { status: 404 }
      );
    }

    // 计算充值后的积分余额
    const newCreditsBalance = subscription.creditsBalance + amount;
    const newCreditsGranted = subscription.creditsGranted + amount;

    // 更新订阅信息
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({
        creditsBalance: newCreditsBalance,
        creditsGranted: newCreditsGranted,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();

    // 记录积分交易
    await db.insert(creditTransactions).values({
      userId: payload.userId,
      subscriptionId: subscription.id,
      amount: amount,
      balance: newCreditsBalance,
      type: 'grant',
      description: description || `管理员赠送${amount}积分`,
    });

    return NextResponse.json({
      message: '积分增加成功',
      subscription: updatedSubscription,
      creditsAdded: amount,
    });
  } catch (error) {
    console.error('增加积分失败:', error);
    return NextResponse.json(
      { error: '增加积分失败，请稍后重试' },
      { status: 500 }
    );
  }
}
