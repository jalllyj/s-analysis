import crypto from 'crypto';
import { getAlipayConfig } from './config';

/**
 * RSA签名
 */
export function rsaSign(content: string, privateKey: string): string {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(content, 'utf8');
  return sign.sign(privateKey, 'base64');
}

/**
 * RSA验签
 */
export function rsaVerify(content: string, sign: string, publicKey: string): boolean {
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(content, 'utf8');
  return verify.verify(publicKey, sign, 'base64');
}

/**
 * 生成支付订单参数
 */
export function buildOrderParams(params: Record<string, any>): Record<string, string> {
  const orderedParams: Record<string, string> = {};
  const keys = Object.keys(params).sort();

  for (const key of keys) {
    if (params[key] && params[key] !== undefined && params[key] !== null) {
      orderedParams[key] = String(params[key]);
    }
  }

  return orderedParams;
}

/**
 * 生成签名
 */
export function generateSign(params: Record<string, any>): string {
  const config = getAlipayConfig();
  const orderedParams = buildOrderParams(params);
  const signContent = Object.keys(orderedParams)
    .map(key => `${key}=${orderedParams[key]}`)
    .join('&');

  return rsaSign(signContent, config.privateKey);
}

/**
 * 验证异步通知签名
 */
export function verifyNotifySign(params: Record<string, any>): boolean {
  const config = getAlipayConfig();

  // 获取签名
  const sign = params.sign;
  const signType = params.sign_type || 'RSA2';

  // 移除签名相关参数
  const { sign: _, sign_type: __, ...verifyParams } = params;

  // 构建待验签字符串
  const orderedParams = buildOrderParams(verifyParams);
  const signContent = Object.keys(orderedParams)
    .map(key => `${key}=${orderedParams[key]}`)
    .join('&');

  // 验签
  return rsaVerify(signContent, sign, config.alipayPublicKey);
}

/**
 * 构建支付请求URL
 */
export function buildPaymentUrl(method: string, params: Record<string, any>): string {
  const config = getAlipayConfig();

  // 构建公共参数
  const commonParams: Record<string, any> = {
    app_id: config.appId,
    method: method,
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    version: '1.0',
    notify_url: config.notifyUrl,
    return_url: config.returnUrl,
  };

  // 合并参数
  const allParams: Record<string, any> = { ...commonParams, ...params };

  // 生成签名
  const sign = generateSign(allParams);

  // 添加签名
  allParams.sign = sign;

  // 构建URL
  const queryString = Object.keys(allParams)
    .map(key => `${key}=${encodeURIComponent(allParams[key])}`)
    .join('&');

  return `${config.gatewayUrl}?${queryString}`;
}
