import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { PRICING_PLANS } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    // 检查用户是否已存在
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
      })
      .returning();

    // 创建免费订阅
    const freePlan = PRICING_PLANS.find(plan => plan.id === 'free');
    if (!freePlan) {
      throw new Error('找不到免费套餐配置');
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1); // 免费试用期1个月

    await db.insert(subscriptions).values({
      userId: newUser.id,
      planType: 'free',
      status: 'active',
      startDate: now,
      endDate,
      monthlyQuota: freePlan.monthlyQuota,
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      message: '注册成功',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
