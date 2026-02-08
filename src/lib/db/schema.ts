import { pgTable, serial, text, timestamp, integer, decimal, boolean } from 'drizzle-orm/pg-core';

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
  monthlyQuota: integer('monthly_quota').notNull(), // 每月配额
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
  usedAt: timestamp('used_at').defaultNow(),
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

// 导出类型
export type User = typeof users.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type PaymentRecord = typeof paymentRecords.$inferSelect;
