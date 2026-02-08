import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions, creditTransactions, paymentRecords, topupRequests, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken, parseAuthHeader } from '@/lib/auth';
import { getTierById } from '@/lib/pricing';
import { createTopupApprovalMessage } from '@/lib/feishu';
import { sendFeishuWebhookMessage } from '@/lib/feishu-api';

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

    // 获取用户订阅信息和邮箱
    const [subscription, user] = await Promise.all([
      db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, payload.userId))
        .limit(1),
      db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1),
    ]);

    if (!subscription[0]) {
      return NextResponse.json(
        { error: '未找到订阅信息' },
        { status: 404 }
      );
    }

    if (!user[0]) {
      return NextResponse.json(
        { error: '未找到用户信息' },
        { status: 404 }
      );
    }

    // 创建充值请求（状态为 pending，等待飞书审核）
    const [topupRequest] = await db
      .insert(topupRequests)
      .values({
        userId: payload.userId,
        email: user[0].email,
        tierId: tier.id,
        tierName: tier.name,
        credits: tier.credits,
        price: tier.price,
        receiptFileKey: receiptFileKey || null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 发送消息到飞书进行审核
    try {
      const feishuMessage = createTopupApprovalMessage({
        requestId: topupRequest.id,
        email: user[0].email,
        tierName: tier.name,
        credits: tier.credits,
        price: tier.price,
        receiptUrl: receiptFileKey,
        createdAt: topupRequest.createdAt,
      });

      console.log('准备发送飞书消息:', JSON.stringify(feishuMessage, null, 2));
      const sendResult = await sendFeishuWebhookMessage(feishuMessage);
      console.log('飞书消息发送结果:', sendResult);
    } catch (feishuError) {
      console.error('发送飞书消息失败:', feishuError);
      // 不影响充值请求的创建，只是无法通知管理员
    }

    return NextResponse.json({
      message: '充值请求已提交，等待管理员审核',
      topupRequest: {
        id: topupRequest.id,
        status: topupRequest.status,
        credits: topupRequest.credits,
        price: topupRequest.price,
        createdAt: topupRequest.createdAt,
      },
    });
  } catch (error) {
    console.error('充值失败:', error);
    return NextResponse.json(
      { error: '充值失败，请稍后重试' },
      { status: 500 }
    );
  }
}
