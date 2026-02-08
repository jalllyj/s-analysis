import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { creditTransactions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken, parseAuthHeader } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // 获取订单号
    const { searchParams } = new URL(request.url);
    const outTradeNo = searchParams.get('outTradeNo');

    if (!outTradeNo) {
      return NextResponse.json(
        { error: '订单号不能为空' },
        { status: 400 }
      );
    }

    // 查询订单
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

    return NextResponse.json({
      success: true,
      order: {
        id: transaction.id,
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        credits: transaction.credits,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        tradeNo: transaction.tradeNo,
        description: transaction.description,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      },
    });
  } catch (error) {
    console.error('查询订单失败:', error);
    return NextResponse.json(
      { error: '查询订单失败' },
      { status: 500 }
    );
  }
}
