import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { creditTransactions, subscriptions } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyToken, parseAuthHeader } from '@/lib/auth';
import { queryAlipayOrder, isPaymentSuccess } from '@/lib/alipay/query';

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

    const { outTradeNo } = await request.json();

    if (!outTradeNo) {
      return NextResponse.json(
        { error: '订单号不能为空' },
        { status: 400 }
      );
    }

    // 查询本地订单
    const [transaction] = await db
      .select()
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.transactionId, outTradeNo),
          eq(creditTransactions.userId, payload.userId)
        )
      )
      .limit(1);

    if (!transaction) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    // 如果订单已经完成，直接返回
    if (transaction.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: '订单已完成',
        order: {
          transactionId: transaction.transactionId,
          status: transaction.status,
          credits: transaction.credits,
          completedAt: transaction.completedAt,
        },
      });
    }

    // 查询支付宝订单状态
    try {
      const alipayResult = await queryAlipayOrder(outTradeNo);

      console.log('[Alipay Query] 订单查询结果:', outTradeNo, alipayResult);

      // 如果支付成功，更新订单状态并增加积分
      if (isPaymentSuccess(alipayResult)) {
        // 验证金额
        if (Math.abs(transaction.amount - parseFloat(alipayResult.totalAmount)) > 0.01) {
          console.error('[Alipay Query] 金额不匹配:', transaction.amount, alipayResult.totalAmount);
          return NextResponse.json(
            { error: '金额不匹配' },
            { status: 400 }
          );
        }

        // 更新订单状态
        await db.update(creditTransactions)
          .set({
            status: 'completed',
            tradeNo: alipayResult.tradeNo,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(creditTransactions.id, transaction.id));

        // 增加用户积分
        await db.update(subscriptions)
          .set({
            creditsBalance: sql`${subscriptions.creditsBalance} + ${transaction.credits || 0}`,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.userId, payload.userId));

        console.log('[Alipay Query] 订单确认成功:', outTradeNo, '积分:', transaction.credits);

        return NextResponse.json({
          success: true,
          message: '支付成功，积分已增加',
          order: {
            transactionId: transaction.transactionId,
            status: 'completed',
            credits: transaction.credits,
            tradeNo: alipayResult.tradeNo,
            completedAt: new Date(),
          },
        });
      }

      // 如果订单不存在
      if (alipayResult.code === '40004') {
        return NextResponse.json({
          success: false,
          message: '订单不存在',
          alipayStatus: 'not_found',
        });
      }

      // 如果订单支付中
      if (alipayResult.code === '10000' && alipayResult.tradeStatus === 'WAIT_BUYER_PAY') {
        return NextResponse.json({
          success: false,
          message: '订单未支付，请在支付宝完成支付',
          alipayStatus: 'pending',
        });
      }

      // 其他状态
      return NextResponse.json({
        success: false,
        message: alipayResult.msg || '查询失败',
        alipayStatus: 'other',
      });

    } catch (error) {
      console.error('[Alipay Query] 查询支付宝订单失败:', error);
      return NextResponse.json(
        { error: '查询支付宝订单失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('确认订单失败:', error);
    return NextResponse.json(
      { error: '确认订单失败' },
      { status: 500 }
    );
  }
}
