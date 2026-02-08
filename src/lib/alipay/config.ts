// 支付宝配置

export interface AlipayConfig {
  // 应用ID
  appId: string;
  // 应用私钥
  privateKey: string;
  // 支付宝公钥
  alipayPublicKey: string;
  // 支付宝网关地址
  gatewayUrl: string;
  // 异步通知地址
  notifyUrl: string;
  // 同步跳转地址
  returnUrl: string;
}

// 从环境变量读取配置
export const getAlipayConfig = (): AlipayConfig => {
  return {
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
    gatewayUrl: process.env.ALIPAY_GATEWAY_URL || 'https://openapi.alipay.com/gateway.do',
    notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/alipay/notify`,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/pricing`,
  };
};

// 验证配置是否完整
export const validateAlipayConfig = (): boolean => {
  const config = getAlipayConfig();
  return !!(
    config.appId &&
    config.privateKey &&
    config.alipayPublicKey &&
    config.gatewayUrl
  );
};

// 检查是否处于沙箱模式
export const isSandboxMode = (): boolean => {
  return process.env.ALIPAY_SANDBOX === 'true';
};
