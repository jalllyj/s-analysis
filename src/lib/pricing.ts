export interface CreditsTier {
  id: string;
  name: string;
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
    credits: 10,
    price: 9.9,
    currency: 'CNY',
    unitPrice: 0.99,
    discount: '标准价',
    popular: false,
    stripePriceId: 'price_credits_10_placeholder',
  },
  {
    id: 'credits_50',
    name: '经济包',
    credits: 50,
    price: 39.9,
    currency: 'CNY',
    unitPrice: 0.798,
    discount: '省19%',
    popular: true,
    stripePriceId: 'price_credits_50_placeholder',
  },
  {
    id: 'credits_100',
    name: '优选包',
    credits: 100,
    price: 69.9,
    currency: 'CNY',
    unitPrice: 0.699,
    discount: '省29%',
    popular: false,
    stripePriceId: 'price_credits_100_placeholder',
  },
  {
    id: 'credits_200',
    name: '超值包',
    credits: 200,
    price: 129.9,
    currency: 'CNY',
    unitPrice: 0.65,
    discount: '省34%',
    popular: false,
    stripePriceId: 'price_credits_200_placeholder',
  },
  {
    id: 'credits_500',
    name: '尊享包',
    credits: 500,
    price: 299.9,
    currency: 'CNY',
    unitPrice: 0.6,
    discount: '省39%',
    popular: false,
    stripePriceId: 'price_credits_500_placeholder',
  },
];

export function getTierById(tierId: string): CreditsTier | undefined {
  return CREDITS_TIERS.find(tier => tier.id === tierId);
}

export function calculatePrice(credits: number): number {
  // 根据积分数量计算价格（自动选择最优档位）
  if (credits >= 500) {
    return 299.9;
  } else if (credits >= 200) {
    return 129.9;
  } else if (credits >= 100) {
    return 69.9;
  } else if (credits >= 50) {
    return 39.9;
  } else if (credits >= 10) {
    return 9.9;
  } else {
    // 少于10积分，按入门包单价计算
    return credits * 0.99;
  }
}
