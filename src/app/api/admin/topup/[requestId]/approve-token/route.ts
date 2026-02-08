import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { topupRequests, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';

// 生成一次性审核 token
export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: '缺少请求ID' },
        { status: 400 }
      );
    }

    // 检查充值请求是否存在且状态为 pending
    const [request] = await db
      .select()
      .from(topupRequests)
      .where(eq(topupRequests.id, requestId))
      .limit(1);

    if (!request) {
      return NextResponse.json(
        { error: '充值请求不存在' },
        { status: 404 }
      );
    }

    if (request.status !== 'pending') {
      return NextResponse.json(
        { error: '该请求已被处理' },
        { status: 400 }
      );
    }

    // 生成一次性 token（有效期 24 小时）
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
    );

    const token = await new SignJWT({ requestId, action: 'approve' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('生成审核 token 失败:', error);
    return NextResponse.json(
      { error: '生成 token 失败' },
      { status: 500 }
    );
  }
}
