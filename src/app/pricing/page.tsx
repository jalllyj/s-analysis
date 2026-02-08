'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Zap, Star, Crown } from 'lucide-react';
import Link from 'next/link';
import { PRICING_PLANS } from '@/lib/pricing';

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Zap className="w-8 h-8" />;
      case 'basic':
        return <Star className="w-8 h-8" />;
      case 'pro':
        return <Crown className="w-8 h-8" />;
      case 'enterprise':
        return <Crown className="w-8 h-8" />;
      default:
        return null;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'from-gray-500 to-gray-600';
      case 'basic':
        return 'from-blue-500 to-blue-600';
      case 'pro':
        return 'from-purple-500 to-purple-600';
      case 'enterprise':
        return 'from-amber-500 to-amber-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            股票智能分析
          </h1>
          <div className="flex gap-4">
            {user ? (
              <>
                <Link href="/">
                  <Button variant="ghost">返回首页</Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }}
                >
                  退出登录
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">登录</Button>
                </Link>
                <Link href="/register">
                  <Button>注册</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">选择适合您的套餐</h2>
          <p className="text-xl text-gray-600">
            免费体验，按需升级，随时取消
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all hover:shadow-xl ${
                plan.id === 'pro' ? 'border-2 border-purple-500 shadow-lg' : ''
              }`}
            >
              {plan.id === 'pro' && (
                <div className="absolute top-0 right-0 bg-purple-500 text-white px-3 py-1 text-sm font-medium">
                  推荐
                </div>
              )}
              <CardHeader className={`bg-gradient-to-br ${getPlanColor(plan.id)} text-white`}>
                <div className="flex items-center gap-3 mb-2">
                  {getPlanIcon(plan.id)}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <CardDescription className="text-white/90">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? '免费' : `¥${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-gray-600">/月</span>}
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">
                      每月 {plan.monthlyQuota} 次免费分析额度
                    </span>
                  </div>
                  {plan.monthlyCredits > 0 && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">
                        + {plan.monthlyCredits} 积分/月（可额外分析 {plan.monthlyCredits} 只股票）
                      </span>
                    </div>
                  )}
                  {plan.monthlyCredits === -1 && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">
                        + 无限积分
                      </span>
                    </div>
                  )}
                  {plan.features.slice(1).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.price === 0 ? (
                  <Button
                    className="w-full"
                    variant={user ? 'outline' : 'default'}
                    onClick={() => {
                      if (user) {
                        window.location.href = '/';
                      } else {
                        window.location.href = '/register';
                      }
                    }}
                  >
                    {user ? '开始使用' : '免费注册'}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.id === 'pro' ? 'default' : 'outline'}
                    disabled
                  >
                    即将上线
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-center">常见问题</h3>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">免费版真的免费吗？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  是的，免费版永久免费，每月可以分析5只股票，包含完整的分析功能。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">如何升级套餐？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  登录后访问定价页面，选择合适的套餐即可升级。支付功能即将上线，敬请期待！
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">可以随时取消订阅吗？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  是的，您可以随时取消订阅，取消后仍可使用到当前订阅期结束。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
