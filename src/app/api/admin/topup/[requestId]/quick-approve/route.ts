import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { topupRequests, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// 使用一次性 token 进行审核（无需登录）
export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: '缺少审核 token' },
        { status: 400 }
      );
    }

    // 验证 token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
    );

    let payload;
    try {
      const { payload: decoded } = await jwtVerify(token, secret);
      payload = decoded;
    } catch (error) {
      return NextResponse.json(
        { error: '无效的 token 或 token 已过期' },
        { status: 401 }
      );
    }

    // 检查 token 中的 requestId 是否匹配
    if (payload.requestId !== parseInt(params.requestId)) {
      return NextResponse.json(
        { error: 'Token 不匹配' },
        { status: 400 }
      );
    }

    // 检查充值请求是否存在且状态为 pending
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

    if (request.status !== 'pending') {
      return NextResponse.json(
        { error: `该请求已${request.status}` },
        { status: 400 }
      );
    }

    // 审核通过
    await db
      .update(topupRequests)
      .set({
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: 'one-time-token',
      })
      .where(eq(topupRequests.id, parseInt(params.requestId)));

    // 给用户增加积分
    await db
      .update(users)
      .set({
        credits: sql`${users.credits} + ${request.credits}`,
      })
      .where(eq(users.id, request.userId));

    return NextResponse.json({
      success: true,
      message: '充值审核通过，积分已到账',
      request: {
        email: request.email,
        tierName: request.tierName,
        credits: request.credits,
        price: request.price,
      },
    });
  } catch (error) {
    console.error('审核失败:', error);
    return NextResponse.json(
      { error: '审核失败' },
      { status: 500 }
    );
  }
}
