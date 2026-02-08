import { sql } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod';

// 用户表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 订阅表
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  planType: text('plan_type').notNull(), // 'free', 'basic', 'pro', 'enterprise'
  status: text('status').notNull(), // 'active', 'cancelled', 'expired'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  monthlyQuota: integer('monthly_quota').notNull(), // 每月免费配额
  creditsBalance: integer('credits_balance').default(0).notNull(), // 积分余额
  creditsGranted: integer('credits_granted').default(0).notNull(), // 累计赠送积分
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 使用记录表
export const usageRecords = pgTable('usage_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  subscriptionId: integer('subscription_id').references(() => subscriptions.id),
  stocksAnalyzed: integer('stocks_analyzed').notNull(), // 分析的股票数量
  usedFreeQuota: integer('used_free_quota').default(0), // 使用的免费配额
  creditsUsed: integer('credits_used').default(0), // 使用的积分
  usedAt: timestamp('used_at').defaultNow(),
});

// 积分交易记录表
export const creditTransactions = pgTable('credit_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  subscriptionId: integer('subscription_id').references(() => subscriptions.id),
  transactionId: text('transaction_id').unique(), // 商户订单号（支付宝交易）
  amount: integer('amount').notNull(), // 交易金额（元）
  balance: integer('balance').notNull(), // 交易后余额
  credits: integer('credits'), // 积分数量（正数为增加，负数为消耗）
  type: text('type').notNull(), // 'grant', 'consume', 'refund'
  status: text('status').default('completed').notNull(), // 'pending', 'completed', 'failed'
  paymentMethod: text('payment_method'), // 'alipay', 'wechat', etc.
  tradeNo: text('trade_no'), // 支付宝交易号
  buyerId: text('buyer_id'), // 买家ID
  description: text('description'), // 描述
  completedAt: timestamp('completed_at'), // 完成时间
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 支付记录表
export const paymentRecords = pgTable('payment_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  subscriptionId: integer('subscription_id').references(() => subscriptions.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('CNY'),
  stripePaymentId: text('stripe_payment_id'),
  status: text('status').notNull(), // 'pending', 'completed', 'failed', 'refunded'
  createdAt: timestamp('created_at').defaultNow(),
});

// 使用 createSchemaFactory 配置 date coercion
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Zod schemas for validation
export const insertUserSchema = createCoercedInsertSchema(users).pick({
  email: true,
  name: true,
  password: true,
});

export const insertSubscriptionSchema = createCoercedInsertSchema(subscriptions).pick({
  userId: true,
  planType: true,
  status: true,
  startDate: true,
  endDate: true,
  monthlyQuota: true,
  creditsBalance: true,
  creditsGranted: true,
  stripeSubscriptionId: true,
  stripeCustomerId: true,
});

export const insertUsageRecordSchema = createCoercedInsertSchema(usageRecords).pick({
  userId: true,
  subscriptionId: true,
  stocksAnalyzed: true,
  usedFreeQuota: true,
  creditsUsed: true,
  usedAt: true,
});

export const insertCreditTransactionSchema = createCoercedInsertSchema(creditTransactions).pick({
  userId: true,
  subscriptionId: true,
  amount: true,
  balance: true,
  type: true,
  description: true,
  createdAt: true,
});

export const insertPaymentRecordSchema = createCoercedInsertSchema(paymentRecords).pick({
  userId: true,
  subscriptionId: true,
  amount: true,
  currency: true,
  stripePaymentId: true,
  status: true,
  createdAt: true,
});

// 导出类型
export type User = typeof users.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertUsageRecord = z.infer<typeof insertUsageRecordSchema>;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type InsertPaymentRecord = z.infer<typeof insertPaymentRecordSchema>;
