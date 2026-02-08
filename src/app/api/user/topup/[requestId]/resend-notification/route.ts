import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { topupRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createTopupApprovalMessage } from '@/lib/feishu';
import { sendFeishuWebhookMessage } from '@/lib/feishu-api';
import { verifyToken, parseAuthHeader } from '@/lib/auth';

// 手动重发飞书审核通知
export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
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

    // 获取充值请求
    const [request] = await db
      .select()
      .from(topupRequests)
      .where(eq(topupRequests.id, parseInt(params.requestId)))
      .limit(1);

    if (!request) {
      return NextResponse.json(
        { error: '充值请求不存在' },
        { status: 404 }
      );
    }

    // 检查权限（只能重发自己的请求，或者管理员）
    if (request.userId !== payload.userId) {
      return NextResponse.json(
        { error: '无权限操作此请求' },
        { status: 403 }
      );
    }

    // 创建飞书消息
    const feishuMessage = createTopupApprovalMessage({
      requestId: request.id,
      email: request.email,
      tierName: request.tierName,
      credits: request.credits,
      price: request.price,
      receiptUrl: request.receiptFileKey,
      createdAt: request.createdAt,
    });

    console.log('重发飞书消息:', JSON.stringify(feishuMessage, null, 2));

    // 发送消息
    const result = await sendFeishuWebhookMessage(feishuMessage);

    return NextResponse.json({
      success: result,
      message: result ? '飞书通知已重发' : '重发失败',
      requestId: request.id,
      status: request.status,
    });
  } catch (error: any) {
    console.error('重发飞书通知失败:', error);
    return NextResponse.json(
      {
        error: error.message || '重发失败',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
