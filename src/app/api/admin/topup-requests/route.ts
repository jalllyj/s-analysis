import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { topupRequests } from '@/lib/db/schema';
import { desc, or, like, eq } from 'drizzle-orm';
import { verifyToken, parseAuthHeader } from '@/lib/auth';

// 获取所有充值请求（管理员）
export async function GET(request: NextRequest) {
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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const email = searchParams.get('email');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereCondition: any = undefined;
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(topupRequests.status, status));
    }

    if (email) {
      conditions.push(like(topupRequests.email, `%${email}%`));
    }

    if (conditions.length > 0) {
      whereCondition = conditions.length === 1 ? conditions[0] : or(...conditions);
    }

    // 获取充值请求列表
    const allTopupRequests = await db
      .select()
      .from(topupRequests)
      .where(whereCondition)
      .orderBy(desc(topupRequests.createdAt))
      .limit(limit)
      .offset(offset);

    // 获取总数（用于分页）
    const totalCountResult = await db
      .select({ count: topupRequests.id })
      .from(topupRequests)
      .where(whereCondition);

    const totalCount = totalCountResult.length;

    return NextResponse.json({
      requests: allTopupRequests,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('获取充值请求失败:', error);
    return NextResponse.json(
      { error: '获取失败，请稍后重试' },
      { status: 500 }
    );
  }
}
