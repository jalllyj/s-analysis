import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions, creditTransactions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, amount } = await request.json();

    if (!email || !amount) {
      return NextResponse.json(
        { error: '请提供邮箱和积分数量' },
        { status: 400 }
      );
    }

    // 查找用户
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 查找用户的订阅
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1);

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
    const [updatedSubscription] = await db.update(subscriptions)
      .set({
        creditsBalance: newCreditsBalance,
        creditsGranted: newCreditsGranted,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();

    // 记录积分交易
    await db.insert(creditTransactions).values({
      userId: user.id,
      subscriptionId: subscription.id,
      amount: amount,
      balance: newCreditsBalance,
      type: 'grant',
      description: '管理员充值积分',
    });

    return NextResponse.json({
      message: '积分增加成功',
      user: { id: user.id, email: user.email },
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
