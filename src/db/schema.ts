import { pgTable, serial, timestamp, integer, text, decimal } from 'drizzle-orm/pg-core';

// 统计表 - 记录每次分析请求的统计信息
export const statistics = pgTable('statistics', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull(), // 文件名
  stockCount: integer('stock_count').notNull(), // 分析的股票数量
  totalSearchCount: integer('total_search_count').notNull(), // 总搜索次数
  totalTokens: integer('total_tokens').notNull(), // 总Token消耗（估算）
  analysisDuration: integer('analysis_duration').notNull(), // 分析时长（秒）
  createdAt: timestamp('created_at').notNull().defaultNow(), // 创建时间
});

// 使用统计表 - 记录每日/每月的使用汇总
export const usageSummary = pgTable('usage_summary', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(), // 日期（格式：YYYY-MM-DD）
  totalAnalyses: integer('total_analyses').notNull(), // 总分析次数
  totalStocks: integer('total_stocks').notNull(), // 总分析股票数
  totalTokens: integer('total_tokens').notNull(), // 总Token消耗
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Statistics = typeof statistics.$inferSelect;
export type NewStatistics = typeof statistics.$inferInsert;
export type UsageSummary = typeof usageSummary.$inferSelect;
export type NewUsageSummary = typeof usageSummary.$inferInsert;
