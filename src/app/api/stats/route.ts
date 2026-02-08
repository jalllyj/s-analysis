import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { statistics, usageSummary } from '@/db/schema';
import { desc, sql, gte, and, lte } from 'drizzle-orm';

// 获取统计数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // 计算日期范围
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 获取总体统计
    const totalStats = await db
      .select({
        totalAnalyses: sql<number>`COUNT(*)`,
        totalStocks: sql<number>`SUM(${statistics.stockCount})`,
        totalTokens: sql<number>`SUM(${statistics.totalTokens})`,
        avgDuration: sql<number>`AVG(${statistics.analysisDuration})`,
      })
      .from(statistics);

    // 获取每日使用统计
    const dailyStats = await db
      .select({
        date: sql<string>`DATE(${statistics.createdAt})`,
        analyses: sql<number>`COUNT(*)`,
        stocks: sql<number>`SUM(${statistics.stockCount})`,
        tokens: sql<number>`SUM(${statistics.totalTokens})`,
      })
      .from(statistics)
      .where(gte(statistics.createdAt, startDate))
      .groupBy(sql`DATE(${statistics.createdAt})`)
      .orderBy(sql`DATE(${statistics.createdAt})`);

    // 获取最近的分析记录
    const recentAnalyses = await db
      .select()
      .from(statistics)
      .orderBy(desc(statistics.createdAt))
      .limit(10);

    // 获取积分消耗趋势（使用Token作为积分）
    const tokenTrend = await db
      .select({
        date: sql<string>`DATE(${statistics.createdAt})`,
        tokens: sql<number>`SUM(${statistics.totalTokens})`,
      })
      .from(statistics)
      .where(gte(statistics.createdAt, startDate))
      .groupBy(sql`DATE(${statistics.createdAt})`)
      .orderBy(sql`DATE(${statistics.createdAt})`);

    return NextResponse.json({
      overview: {
        totalAnalyses: totalStats[0]?.totalAnalyses || 0,
        totalStocks: totalStats[0]?.totalStocks || 0,
        totalTokens: totalStats[0]?.totalTokens || 0,
        avgDuration: Math.round(totalStats[0]?.avgDuration || 0),
      },
      dailyStats,
      recentAnalyses,
      tokenTrend,
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
