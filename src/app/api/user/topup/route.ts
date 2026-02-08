import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions, creditTransactions, paymentRecords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken, parseAuthHeader } from '@/lib/auth';
import { getTierById } from '@/lib/pricing';

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

    const { tierId, receiptFileKey } = await request.json();

    if (!tierId) {
      return NextResponse.json(
        { error: '请选择充值档位' },
        { status: 400 }
      );
    }

    // 获取充值档位信息
    const tier = getTierById(tierId);
    if (!tier) {
      return NextResponse.json(
        { error: '无效的充值档位' },
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

    // TODO: 这里应该集成支付网关（如Stripe）
    // 目前为演示目的，直接完成充值
    // 实际生产环境需要：
    // 1. 创建支付订单
    // 2. 调用支付网关
    // 3. 等待支付成功回调
    // 4. 再增加积分

    // 计算充值后的积分余额
    const newCreditsBalance = subscription.creditsBalance + tier.credits;
    const newCreditsGranted = subscription.creditsGranted + tier.credits;

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
      amount: tier.credits,
      balance: newCreditsBalance,
      type: 'grant',
      description: `充值${tier.name}（${tier.credits}积分）`,
    });

    // 记录支付记录
    await db.insert(paymentRecords).values({
      userId: payload.userId,
      subscriptionId: subscription.id,
      amount: tier.price.toString(),
      currency: tier.currency,
      stripePaymentId: receiptFileKey || null,
      status: 'completed',
    });

    return NextResponse.json({
      message: '充值成功',
      subscription: updatedSubscription,
      creditsAdded: tier.credits,
    });
  } catch (error) {
    console.error('充值失败:', error);
    return NextResponse.json(
      { error: '充值失败，请稍后重试' },
      { status: 500 }
    );
  }
}
