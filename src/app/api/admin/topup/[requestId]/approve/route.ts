import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { topupRequests, subscriptions, creditTransactions, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken, parseAuthHeader } from '@/lib/auth';

// 通过充值请求
export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    // 验证管理员身份（可选：可以增加管理员权限检查）
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

    const requestId = parseInt(params.requestId);
    const { remark } = await request.json();

    // 获取充值请求
    const [topupRequest] = await db
      .select()
      .from(topupRequests)
      .where(eq(topupRequests.id, requestId))
      .limit(1);

    if (!topupRequest) {
      return NextResponse.json(
        { error: '充值请求不存在' },
        { status: 404 }
      );
    }

    if (topupRequest.status !== 'pending') {
      return NextResponse.json(
        { error: '该充值请求已处理' },
        { status: 400 }
      );
    }

    // 获取用户订阅信息
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, topupRequest.userId))
      .limit(1);

    if (!subscription) {
      return NextResponse.json(
        { error: '未找到订阅信息' },
        { status: 404 }
      );
    }

    // 计算充值后的积分余额
    const newCreditsBalance = subscription.creditsBalance + topupRequest.credits;
    const newCreditsGranted = subscription.creditsGranted + topupRequest.credits;

    // 更新订阅信息
    await db
      .update(subscriptions)
      .set({
        creditsBalance: newCreditsBalance,
        creditsGranted: newCreditsGranted,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    // 记录积分交易
    await db.insert(creditTransactions).values({
      userId: topupRequest.userId,
      subscriptionId: subscription.id,
      amount: topupRequest.credits,
      balance: newCreditsBalance,
      type: 'grant',
      description: `充值${topupRequest.tierName}（${topupRequest.credits}积分）- 审核通过`,
    });

    // 更新充值请求状态
    await db
      .update(topupRequests)
      .set({
        status: 'approved',
        adminId: payload.userId,
        adminRemark: remark || null,
        updatedAt: new Date(),
      })
      .where(eq(topupRequests.id, requestId));

    return NextResponse.json({
      message: '充值审核通过',
      requestId: requestId,
      credits: topupRequest.credits,
    });
  } catch (error) {
    console.error('审核通过失败:', error);
    return NextResponse.json(
      { error: '审核失败，请稍后重试' },
      { status: 500 }
    );
  }
}
