import crypto from 'crypto';
import { getAlipayConfig } from './config';

/**
 * 查询支付宝订单状态
 * 文档：https://opendocs.alipay.com/open/02ivbs
 */
export interface AlipayQueryResult {
  code: string;
  msg: string;
  tradeStatus: string;
  outTradeNo: string;
  tradeNo: string;
  totalAmount: string;
}

/**
 * 查询支付宝订单
 */
export async function queryAlipayOrder(outTradeNo: string): Promise<AlipayQueryResult> {
  const config = getAlipayConfig();

  // 构建查询参数
  const bizContent = {
    out_trade_no: outTradeNo,
  };

  // 构建公共参数
  const commonParams: Record<string, any> = {
    app_id: config.appId,
    method: 'alipay.trade.query',
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    version: '1.0',
    biz_content: JSON.stringify(bizContent),
  };

  // 生成签名
  const orderedParams: Record<string, string> = {};
  const keys = Object.keys(commonParams).sort();

  for (const key of keys) {
    if (commonParams[key] && commonParams[key] !== undefined && commonParams[key] !== null) {
      orderedParams[key] = String(commonParams[key]);
    }
  }

  const signContent = Object.keys(orderedParams)
    .map(key => `${key}=${orderedParams[key]}`)
    .join('&');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signContent, 'utf8');
  const signature = sign.sign(config.privateKey, 'base64');

  // 添加签名
  orderedParams.sign = signature;

  // 构建请求URL
  const queryString = Object.keys(orderedParams)
    .map(key => `${key}=${encodeURIComponent(orderedParams[key])}`)
    .join('&');

  const url = `${config.gatewayUrl}?${queryString}`;

  // 发送请求
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const text = await response.text();
    const data = JSON.parse(text);

    // 解析响应
    const result = data.alipay_trade_query_response;

    return {
      code: result.code,
      msg: result.msg,
      tradeStatus: result.trade_status,
      outTradeNo: result.out_trade_no,
      tradeNo: result.trade_no,
      totalAmount: result.total_amount,
    };
  } catch (error) {
    console.error('查询支付宝订单失败:', error);
    throw new Error('查询支付宝订单失败');
  }
}

/**
 * 判断订单是否支付成功
 */
export function isPaymentSuccess(result: AlipayQueryResult): boolean {
  // 支付成功的状态：TRADE_SUCCESS（交易支付成功）、TRADE_FINISHED（交易结束）
  return result.code === '10000' &&
    (result.tradeStatus === 'TRADE_SUCCESS' || result.tradeStatus === 'TRADE_FINISHED');
}

/**
 * 判断订单是否支付中
 */
export function isPaymentPending(result: AlipayQueryResult): boolean {
  return result.code === '10000' && result.tradeStatus === 'WAIT_BUYER_PAY';
}

/**
 * 判断订单是否不存在
 */
export function isOrderNotFound(result: AlipayQueryResult): boolean {
  return result.code === '40004';
}
