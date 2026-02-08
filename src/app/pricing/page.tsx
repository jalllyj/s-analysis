'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Zap, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { CREDITS_TIERS, FREE_QUOTA } from '@/lib/pricing';

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const getTierColor = (tierId: string) => {
    switch (tierId) {
      case 'credits_10':
        return 'from-gray-500 to-gray-600';
      case 'credits_50':
        return 'from-blue-500 to-blue-600';
      case 'credits_100':
        return 'from-purple-500 to-purple-600';
      case 'credits_200':
        return 'from-amber-500 to-amber-600';
      case 'credits_500':
        return 'from-rose-500 to-rose-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'credits_10':
        return <Zap className="w-8 h-8" />;
      case 'credits_50':
        return <TrendingUp className="w-8 h-8" />;
      case 'credits_100':
        return <Sparkles className="w-8 h-8" />;
      case 'credits_200':
        return <Sparkles className="w-8 h-8" />;
      case 'credits_500':
        return <Sparkles className="w-8 h-8" />;
      default:
        return null;
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
          <h2 className="text-4xl font-bold mb-4">灵活充值，按需使用</h2>
          <p className="text-xl text-gray-600">
            每月{FREE_QUOTA}次免费分析，超出后按积分充值，积分永久有效
          </p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {CREDITS_TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={`relative overflow-hidden transition-all hover:shadow-xl ${
                tier.popular ? 'border-2 border-blue-500 shadow-lg scale-105' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-medium">
                  推荐
                </div>
              )}
              <CardHeader className={`bg-gradient-to-br ${getTierColor(tier.id)} text-white`}>
                <div className="flex items-center gap-3 mb-2">
                  {getTierIcon(tier.id)}
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                </div>
                <CardDescription className="text-white/90">
                  {tier.credits} 积分
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4">
                  <span className="text-4xl font-bold">
                    ¥{tier.price}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">单价</span>
                    <span className="font-medium">¥{tier.unitPrice.toFixed(2)}/股</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">折扣</span>
                    <span className="font-medium text-green-600">{tier.discount}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">可分析</span>
                    <span className="font-medium">{tier.credits} 只股票</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">积分永久有效</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">所有分析功能</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">支持Excel批量上传</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  variant={tier.popular ? 'default' : 'outline'}
                  disabled
                >
                  即将上线
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Free Tier Info */}
        <Card className="mt-12 max-w-4xl mx-auto bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-green-600" />
              <div>
                <CardTitle>免费使用</CardTitle>
                <CardDescription>注册即享每月免费额度</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>每月免费分析额度</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{FREE_QUOTA} 次</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>包含功能</span>
                </div>
                <span className="text-gray-600">完整分析功能</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>文件格式</span>
                </div>
                <span className="text-gray-600">支持Excel上传</span>
              </div>
              {!user && (
                <Link href="/register">
                  <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                    立即注册，免费使用
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-center">常见问题</h3>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">如何使用积分？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  每分析一只股票消耗1积分。每月前{FREE_QUOTA}只股票使用免费额度，
                  免费额度用完后自动扣除积分。积分充值后永久有效，没有有效期限制。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">积分可以累积吗？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  是的，积分可以累积使用，没有有效期限制。您可以一次性购买更多积分享受更优惠的单价。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">免费额度每月会重置吗？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  是的，免费额度每月1号重置。上月未使用的免费额度不会累积到下月，建议充分利用每月的免费额度。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">如何充值？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  登录后访问本页面，选择合适的充值档位即可。支付功能即将上线，敬请期待！
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
