import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions, creditTransactions, paymentRecords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken, parseAuthHeader } from '@/lib/auth';
import { getTierById } from '@/lib/pricing';
import { buildPaymentUrl } from '@/lib/alipay/utils';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const token = parseAuthHeader(request);
    if (!token) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: '无效的token' },
        { status: 401 }
      );
    }

    const { tierId } = await request.json();

    if (!tierId) {
      return NextResponse.json(
        { error: '请选择充值档位' },
        { status: 400 }
      );
    }

    // 获取充值档位信息
    const tier = getTierById(tierId);
    if (!tier) {
      return NextResponse.json(
        { error: '无效的充值档位' },
        { status: 400 }
      );
    }

    // 获取用户订阅信息
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, payload.userId))
      .limit(1);

    if (!subscription) {
      return NextResponse.json(
        { error: '未找到订阅信息' },
        { status: 404 }
      );
    }

    // 生成订单号
    const outTradeNo = `TOPUP_${payload.userId}_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

    // 记录积分交易（状态为pending）
    await db.insert(creditTransactions).values({
      userId: payload.userId,
      subscriptionId: subscription.id,
      transactionId: outTradeNo,
      amount: tier.price,
      balance: subscription.creditsBalance,
      credits: tier.credits,
      type: 'grant',
      description: `充值${tier.name}（${tier.credits}积分）`,
      status: 'pending',
      paymentMethod: 'alipay',
    });

    // 构建支付宝支付参数
    const bizContent = {
      out_trade_no: outTradeNo,
      total_amount: tier.price.toFixed(2),
      subject: `股票分析工具 - ${tier.name}`,
      body: `充值${tier.credits}积分`,
      product_code: 'FAST_INSTANT_TRADE_PAY', // 快捷支付
    };

    // 生成支付宝支付URL
    const paymentUrl = buildPaymentUrl('alipay.trade.page.pay', bizContent);

    return NextResponse.json({
      message: '订单创建成功',
      paymentUrl: paymentUrl,
      outTradeNo: outTradeNo,
      tier: tier,
    });
  } catch (error) {
    console.error('创建充值订单失败:', error);
    return NextResponse.json(
      { error: '创建充值订单失败，请稍后重试' },
      { status: 500 }
    );
  }
}
