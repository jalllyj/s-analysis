import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { topupRequests } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyToken, parseAuthHeader } from '@/lib/auth';

// 获取用户的充值请求列表
export async function GET(request: NextRequest) {
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

    // 获取用户的充值请求列表
    const userTopupRequests = await db
      .select()
      .from(topupRequests)
      .where(eq(topupRequests.userId, payload.userId))
      .orderBy(desc(topupRequests.createdAt));

    return NextResponse.json({
      requests: userTopupRequests,
    });
  } catch (error) {
    console.error('获取充值请求失败:', error);
    return NextResponse.json(
      { error: '获取失败，请稍后重试' },
      { status: 500 }
    );
  }
}
