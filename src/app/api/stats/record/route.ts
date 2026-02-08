import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { statistics, usageSummary } from '@/db/schema';
import { sql } from 'drizzle-orm';

interface RecordData {
  fileName: string;
  stockCount: number;
  totalSearchCount: number;
  totalTokens: number;
  analysisDuration: number;
}

// 记录统计数据
export async function POST(request: NextRequest) {
  try {
    const data: RecordData = await request.json();

    // 插入统计数据
    const newRecord = await db.insert(statistics).values({
      fileName: data.fileName,
      stockCount: data.stockCount,
      totalSearchCount: data.totalSearchCount,
      totalTokens: data.totalTokens,
      analysisDuration: data.analysisDuration,
    }).returning();

    // 更新或创建每日汇总
    const today = new Date().toISOString().split('T')[0];
    
    const existingSummary = await db
      .select()
      .from(usageSummary)
      .where(sql`${usageSummary.date} = ${today}`);

    if (existingSummary.length > 0) {
      // 更新现有汇总
      await db
        .update(usageSummary)
        .set({
          totalAnalyses: sql`${usageSummary.totalAnalyses} + 1`,
          totalStocks: sql`${usageSummary.totalStocks} + ${data.stockCount}`,
          totalTokens: sql`${usageSummary.totalTokens} + ${data.totalTokens}`,
        })
        .where(sql`${usageSummary.date} = ${today}`);
    } else {
      // 创建新的汇总
      await db.insert(usageSummary).values({
        date: today,
        totalAnalyses: 1,
        totalStocks: data.stockCount,
        totalTokens: data.totalTokens,
      });
    }

    return NextResponse.json({ success: true, record: newRecord[0] });
  } catch (error) {
    console.error('记录统计数据失败:', error);
    return NextResponse.json(
      { error: '记录统计数据失败' },
      { status: 500 }
    );
  }
}
