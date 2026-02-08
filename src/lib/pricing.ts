export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyQuota: number; // 每月免费额度
  monthlyCredits: number; // 每月赠送积分
  price: number;
  currency: string;
  features: string[];
  stripePriceId: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: '免费版',
    description: '适合个人用户体验',
    monthlyQuota: 5,
    monthlyCredits: 0,
    price: 0,
    currency: 'CNY',
    features: [
      '每月5次免费分析',
      '基础分析功能',
      '支持Excel上传',
      '社区支持',
    ],
    stripePriceId: '',
  },
  {
    id: 'basic',
    name: '基础版',
    description: '适合轻度投资者',
    monthlyQuota: 5,
    monthlyCredits: 50,
    price: 29,
    currency: 'CNY',
    features: [
      '每月5次免费分析',
      '+ 50积分/月（可分析50只股票）',
      '完整分析功能',
      '热点概念分析',
      '订单追踪',
      '邮件支持',
    ],
    stripePriceId: 'price_basic_placeholder',
  },
  {
    id: 'pro',
    name: '专业版',
    description: '适合专业投资者',
    monthlyQuota: 5,
    monthlyCredits: 500,
    price: 99,
    currency: 'CNY',
    features: [
      '每月5次免费分析',
      '+ 500积分/月（可分析500只股票）',
      '所有分析功能',
      '优先技术支持',
      'API访问',
      '数据分析导出',
    ],
    stripePriceId: 'price_pro_placeholder',
  },
  {
    id: 'enterprise',
    name: '企业版',
    description: '适合机构用户',
    monthlyQuota: 5,
    monthlyCredits: -1, // -1 表示无限
    price: 299,
    currency: 'CNY',
    features: [
      '每月5次免费分析',
      '+ 无限积分',
      '专属客户经理',
      '定制化服务',
      '团队协作',
      '企业级支持',
    ],
    stripePriceId: 'price_enterprise_placeholder',
  },
];

export function getPlanById(planId: string): PricingPlan | undefined {
  return PRICING_PLANS.find(plan => plan.id === planId);
}

export function isUnlimited(planId: string): boolean {
  const plan = getPlanById(planId);
  return plan?.monthlyQuota === -1;
}
