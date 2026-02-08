import { NextRequest, NextResponse } from 'next/server';
import { verifyNotifySign } from '@/lib/alipay/utils';
import { db } from '@/lib/db';
import { creditTransactions, subscriptions } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * 支付宝异步通知回调接口
 * 文档：https://opendocs.alipay.com/open/203/105286
 */
export async function POST(req: NextRequest) {
  try {
    // 获取POST数据
    const formData = await req.formData();
    const params: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      params[key] = value;
    }

    console.log('[Alipay Notify] 收到通知:', params);

    // 1. 验证签名
    const signValid = verifyNotifySign(params);
    if (!signValid) {
      console.error('[Alipay Notify] 签名验证失败');
      return NextResponse.json({ error: '签名验证失败' }, { status: 400 });
    }

    // 2. 解析参数
    const tradeStatus = params.trade_status; // 交易状态
    const outTradeNo = params.out_trade_no; // 商户订单号
    const tradeNo = params.trade_no; // 支付宝交易号
    const totalAmount = parseFloat(params.total_amount); // 支付金额
    const buyerId = params.buyer_id; // 买家支付宝用户ID

    console.log('[Alipay Notify] 订单号:', outTradeNo, '状态:', tradeStatus);

    // 3. 检查交易状态
    // 交易成功状态：TRADE_SUCCESS（交易支付成功）、TRADE_FINISHED（交易结束，不可退款）
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      console.log('[Alipay Notify] 交易未成功:', tradeStatus);
      return NextResponse.json({ success: false }, { status: 200 });
    }

    // 4. 查找对应的交易记录
    const transaction = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.transactionId, outTradeNo))
      .limit(1);

    if (!transaction || transaction.length === 0) {
      console.error('[Alipay Notify] 订单不存在:', outTradeNo);
      return NextResponse.json({ error: '订单不存在' }, { status: 400 });
    }

    const tx = transaction[0];

    // 5. 检查订单状态，避免重复处理
    if (tx.status === 'completed') {
      console.log('[Alipay Notify] 订单已处理:', outTradeNo);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // 6. 验证金额
    if (Math.abs(tx.amount - totalAmount) > 0.01) {
      console.error('[Alipay Notify] 金额不匹配:', tx.amount, totalAmount);
      return NextResponse.json({ error: '金额不匹配' }, { status: 400 });
    }

    // 7. 增加用户积分
    await db.update(subscriptions)
      .set({
        creditsBalance: sql`${subscriptions.creditsBalance} + ${tx.credits || 0}`,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, tx.userId));

    // 8. 更新交易状态
    await db.update(creditTransactions)
      .set({
        status: 'completed',
        paymentMethod: 'alipay',
        tradeNo: tradeNo,
        buyerId: buyerId,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(creditTransactions.id, tx.id));

    console.log('[Alipay Notify] 处理成功:', outTradeNo, '用户:', tx.userId, '积分:', tx.credits);

    // 9. 返回success给支付宝
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[Alipay Notify] 处理失败:', error);
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}

// GET方法仅用于调试，支付宝使用POST
export async function GET(req: NextRequest) {
  return NextResponse.json({ message: '支付宝异步通知接口，请使用POST请求' });
}
