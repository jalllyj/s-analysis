export interface CreditsTier {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: number;
  currency: string;
  unitPrice: number; // 单价（元/股）
  discount: string; // 折扣描述
  popular?: boolean; // 是否推荐
  stripePriceId: string;
}

// 免费额度配置
export const FREE_QUOTA = 5; // 每月5次免费分析

// 充值档位配置
export const CREDITS_TIERS: CreditsTier[] = [
  {
    id: 'credits_10',
    name: '入门包',
    description: '适合少量分析需求',
    credits: 10,
    price: 5,
    currency: 'CNY',
    unitPrice: 0.5,
    discount: '标准价',
    popular: false,
    stripePriceId: 'price_credits_10_placeholder',
  },
  {
    id: 'credits_50',
    name: '经济包',
    description: '性价比之选，推荐',
    credits: 50,
    price: 20,
    currency: 'CNY',
    unitPrice: 0.4,
    discount: '省50%',
    popular: true,
    stripePriceId: 'price_credits_50_placeholder',
  },
];

export function getTierById(tierId: string): CreditsTier | undefined {
  return CREDITS_TIERS.find(tier => tier.id === tierId);
}

export function calculatePrice(credits: number): number {
  // 根据积分数量计算价格（自动选择最优档位）
  if (credits >= 50) {
    return 39.9;
  } else if (credits >= 10) {
    return 9.9;
  } else {
    // 少于10积分，按入门包单价计算
    return credits * 0.99;
  }
}
