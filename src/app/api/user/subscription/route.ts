import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions, usageRecords } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { verifyToken, parseAuthHeader } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const token = parseAuthHeader(request);
    if (!token) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: '无效的访问令牌' },
        { status: 401 }
      );
    }

    // 获取当前活跃订阅
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, payload.userId),
          eq(subscriptions.status, 'active'),
          // 检查订阅是否在有效期内
          sql`${subscriptions.endDate} IS NULL OR ${subscriptions.endDate} > NOW()`
        )
      )
      .limit(1);

    if (!subscription) {
      return NextResponse.json({
        message: '未找到活跃订阅',
        subscription: null,
        usage: null,
      });
    }

    // 计算本月使用量
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usageResult = await db
      .select({
        totalStocks: sql<number>`COALESCE(SUM(${usageRecords.stocksAnalyzed}), 0)`,
      })
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.userId, payload.userId),
          eq(usageRecords.subscriptionId, subscription.id),
          gte(usageRecords.usedAt, startOfMonth)
        )
      );

    const totalUsed = usageResult[0]?.totalStocks || 0;
    const remaining = subscription.monthlyQuota === -1 
      ? -1 
      : Math.max(0, subscription.monthlyQuota - totalUsed);
    const isUnlimited = subscription.monthlyQuota === -1;

    return NextResponse.json({
      subscription,
      usage: {
        totalUsed,
        remaining,
        isUnlimited,
        monthlyQuota: subscription.monthlyQuota,
      },
    });
  } catch (error) {
    console.error('获取订阅信息失败:', error);
    return NextResponse.json(
      { error: '获取订阅信息失败' },
      { status: 500 }
    );
  }
}
