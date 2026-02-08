import { db } from '@/lib/db';
import { subscriptions, usageRecords, creditTransactions } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export interface QuotaCheckResult {
  allowed: boolean;
  message: string;
  subscriptionId?: number;
  freeQuotaUsed: number;
  freeQuotaRemaining: number;
  creditsBalance: number;
  creditsNeeded: number;
}

// 每分析一只股票消耗的积分
const CREDITS_PER_STOCK = 1;

// 每个套餐每月赠送的积分
const MONTHLY_CREDITS: Record<string, number> = {
  free: 0,
  basic: 50,
  pro: 500,
  enterprise: -1, // -1 表示无限
};

export async function checkUserQuota(
  userId: number,
  stocksCount: number
): Promise<QuotaCheckResult> {
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
        freeQuotaUsed: 0,
        freeQuotaRemaining: 0,
        creditsBalance: 0,
        creditsNeeded: stocksCount * CREDITS_PER_STOCK,
      };
    }

    // 计算本月免费配额使用情况
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const freeUsageResult = await db
      .select({
        totalUsed: sql<number>`COALESCE(SUM(${usageRecords.usedFreeQuota}), 0)`,
      })
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.userId, userId),
          eq(usageRecords.subscriptionId, subscription.id),
          gte(usageRecords.usedAt, startOfMonth)
        )
      );

    const freeQuotaUsed = freeUsageResult[0]?.totalUsed || 0;
    const freeQuotaRemaining = Math.max(0, subscription.monthlyQuota - freeQuotaUsed);

    // 计算需要的积分
    const creditsNeeded = stocksCount * CREDITS_PER_STOCK;
    const freeQuotaAvailable = freeQuotaRemaining;

    // 如果免费额度足够，直接通过
    if (freeQuotaAvailable >= stocksCount) {
      return {
        allowed: true,
        message: `使用免费额度（剩余 ${freeQuotaAvailable - stocksCount} 次）`,
        subscriptionId: subscription.id,
        freeQuotaUsed,
        freeQuotaRemaining: freeQuotaAvailable,
        creditsBalance: subscription.creditsBalance,
        creditsNeeded: 0,
      };
    }

    // 免费额度不足，检查积分
    const stocksNeedCredits = stocksCount - freeQuotaAvailable;
    const creditsRequired = stocksNeedCredits * CREDITS_PER_STOCK;
    const creditsBalance = subscription.creditsBalance ?? 0;

    // 检查积分是否足够
    if (creditsBalance >= creditsRequired) {
      return {
        allowed: true,
        message: `使用免费额度 + 积分（消耗 ${creditsRequired} 积分，剩余 ${creditsBalance - creditsRequired} 积分）`,
        subscriptionId: subscription.id,
        freeQuotaUsed,
        freeQuotaRemaining: 0,
        creditsBalance,
        creditsNeeded: creditsRequired,
      };
    }

    // 积分也不够
    if (creditsBalance > 0) {
      const additionalCreditsNeeded = creditsRequired - creditsBalance;
      return {
        allowed: false,
        message: `配额不足：免费额度已用完，积分也不够。还需要 ${additionalCreditsNeeded} 积分，请升级套餐`,
        subscriptionId: subscription.id,
        freeQuotaUsed,
        freeQuotaRemaining: 0,
        creditsBalance,
        creditsNeeded: creditsRequired,
      };
    }

    return {
      allowed: false,
      message: `本月免费额度已用完（${subscription.monthlyQuota}次），积分余额为0。请升级套餐获取积分`,
      subscriptionId: subscription.id,
      freeQuotaUsed,
      freeQuotaRemaining: 0,
      creditsBalance: 0,
      creditsNeeded: creditsRequired,
    };
  } catch (error) {
    console.error('检查配额失败:', error);
    return {
      allowed: false,
      message: '检查配额失败，请稍后重试',
      freeQuotaUsed: 0,
      freeQuotaRemaining: 0,
      creditsBalance: 0,
      creditsNeeded: stocksCount * CREDITS_PER_STOCK,
    };
  }
}

export async function recordUsage(
  userId: number,
  subscriptionId: number,
  stocksCount: number
): Promise<void> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 获取当前订阅信息
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription) {
      console.error('订阅不存在');
      return;
    }

    // 计算本月已使用的免费配额
    const freeUsageResult = await db
      .select({
        totalUsed: sql<number>`COALESCE(SUM(${usageRecords.usedFreeQuota}), 0)`,
      })
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.userId, userId),
          eq(usageRecords.subscriptionId, subscriptionId),
          gte(usageRecords.usedAt, startOfMonth)
        )
      );

    const freeQuotaUsed = freeUsageResult[0]?.totalUsed || 0;
    const freeQuotaRemaining = Math.max(0, subscription.monthlyQuota - freeQuotaUsed);

    // 计算使用情况
    let usedFreeQuota = 0;
    let creditsUsed = 0;

    if (freeQuotaRemaining >= stocksCount) {
      // 全部使用免费额度
      usedFreeQuota = stocksCount;
    } else {
      // 使用完免费额度，剩余用积分
      usedFreeQuota = freeQuotaRemaining;
      creditsUsed = (stocksCount - freeQuotaRemaining) * CREDITS_PER_STOCK;
    }

    // 记录使用
    await db.insert(usageRecords).values({
      userId,
      subscriptionId,
      stocksAnalyzed: stocksCount,
      usedFreeQuota,
      creditsUsed,
    });

    // 如果消耗了积分，更新积分余额并记录交易
    if (creditsUsed > 0) {
      const newBalance = Math.max(0, subscription.creditsBalance - creditsUsed);

      await db
        .update(subscriptions)
        .set({ creditsBalance: newBalance })
        .where(eq(subscriptions.id, subscriptionId));

      // 记录积分交易
      await db.insert(creditTransactions).values({
        userId,
        subscriptionId,
        amount: -creditsUsed,
        balance: newBalance,
        type: 'consume',
        description: `分析 ${stocksCount} 只股票`,
      });
    }
  } catch (error) {
    console.error('记录使用失败:', error);
    // 不抛出错误，避免影响主流程
  }
}

export async function grantCredits(
  userId: number,
  subscriptionId: number,
  amount: number,
  description: string
): Promise<void> {
  try {
    // 获取当前积分余额
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription) {
      console.error('订阅不存在');
      return;
    }

    const newBalance = subscription.creditsBalance + amount;

    // 更新积分余额
    await db
      .update(subscriptions)
      .set({
        creditsBalance: newBalance,
        creditsGranted: subscription.creditsGranted + amount,
      })
      .where(eq(subscriptions.id, subscriptionId));

    // 记录积分交易
    await db.insert(creditTransactions).values({
      userId,
      subscriptionId,
      amount,
      balance: newBalance,
      type: 'grant',
      description,
    });
  } catch (error) {
    console.error('赠送积分失败:', error);
  }
}
