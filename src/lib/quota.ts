import { db } from '@/lib/db';
import { subscriptions, usageRecords } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export interface QuotaCheckResult {
  allowed: boolean;
  message: string;
  subscriptionId?: number;
}

export async function checkUserQuota(userId: number): Promise<QuotaCheckResult> {
  try {
    // 获取当前活跃订阅
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          sql`${subscriptions.endDate} IS NULL OR ${subscriptions.endDate} > NOW()`
        )
      )
      .limit(1);

    if (!subscription) {
      return {
        allowed: false,
        message: '未找到有效的订阅，请升级套餐',
      };
    }

    // 无限套餐直接通过
    if (subscription.monthlyQuota === -1) {
      return {
        allowed: true,
        message: '无限套餐',
        subscriptionId: subscription.id,
      };
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
          eq(usageRecords.userId, userId),
          eq(usageRecords.subscriptionId, subscription.id),
          gte(usageRecords.usedAt, startOfMonth)
        )
      );

    const totalUsed = usageResult[0]?.totalStocks || 0;
    const remaining = subscription.monthlyQuota - totalUsed;

    if (remaining <= 0) {
      return {
        allowed: false,
        message: `本月配额已用完（${subscription.monthlyQuota}次），请升级套餐或等待下个月重置`,
      };
    }

    return {
      allowed: true,
      message: `剩余配额：${remaining}次`,
      subscriptionId: subscription.id,
    };
  } catch (error) {
    console.error('检查配额失败:', error);
    return {
      allowed: false,
      message: '检查配额失败，请稍后重试',
    };
  }
}

export async function recordUsage(
  userId: number,
  subscriptionId: number,
  stocksCount: number
): Promise<void> {
  try {
    await db.insert(usageRecords).values({
      userId,
      subscriptionId,
      stocksAnalyzed: stocksCount,
    });
  } catch (error) {
    console.error('记录使用失败:', error);
    // 不抛出错误，避免影响主流程
  }
}
