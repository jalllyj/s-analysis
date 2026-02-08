import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { topupRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken, parseAuthHeader } from '@/lib/auth';

// 拒绝充值请求
export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    // 验证管理员身份
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

    // 更新充值请求状态为已拒绝
    await db
      .update(topupRequests)
      .set({
        status: 'rejected',
        adminId: payload.userId,
        adminRemark: remark || null,
        updatedAt: new Date(),
      })
      .where(eq(topupRequests.id, requestId));

    return NextResponse.json({
      message: '充值审核已拒绝',
      requestId: requestId,
    });
  } catch (error) {
    console.error('拒绝审核失败:', error);
    return NextResponse.json(
      { error: '操作失败，请稍后重试' },
      { status: 500 }
    );
  }
}
