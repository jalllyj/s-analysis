import { db } from '/workspace/projects/src/lib/db/index.js';
import { subscriptions, creditTransactions, users } from '/workspace/projects/src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

async function addTestCredits() {
  try {
    // 查找用户
    const [user] = await db.select().from(users).where(
      eq(users.email, '1121169711@qq.com')
    ).limit(1);

    if (!user) {
      console.error('用户不存在');
      process.exit(1);
    }

    console.log('找到用户:', user);

    // 查找用户的订阅
    const [subscription] = await db.select().from(subscriptions).where(
      eq(subscriptions.userId, user.id)
    ).limit(1);

    if (!subscription) {
      console.error('未找到订阅信息');
      process.exit(1);
    }

    console.log('当前积分余额:', subscription.creditsBalance);

    // 增加2000积分
    const creditsToAdd = 2000;
    const newCreditsBalance = subscription.creditsBalance + creditsToAdd;
    const newCreditsGranted = subscription.creditsGranted + creditsToAdd;

    // 更新订阅
    const [updatedSubscription] = await db.update(subscriptions)
      .set({
        creditsBalance: newCreditsBalance,
        creditsGranted: newCreditsGranted,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();

    // 记录积分交易
    await db.insert(creditTransactions).values({
      userId: user.id,
      subscriptionId: subscription.id,
      amount: creditsToAdd,
      balance: newCreditsBalance,
      type: 'grant',
      description: '测试充值2000积分',
    });

    console.log('充值成功!');
    console.log('增加积分:', creditsToAdd);
    console.log('新积分余额:', updatedSubscription.creditsBalance);

    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

addTestCredits();
