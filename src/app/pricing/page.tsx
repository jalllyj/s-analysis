'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Zap, TrendingUp, ArrowRight, QrCode } from 'lucide-react';
import Link from 'next/link';
import { CREDITS_TIERS, FREE_QUOTA } from '@/lib/pricing';
import { createToken } from '@/lib/auth';
import { toast } from 'sonner';
import QRCodeTopupModal from '@/components/QRCodeTopupModal';

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchSubscription();
    }
  }, []);

  const fetchSubscription = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const token = await createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      const response = await fetch('/api/user/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('获取订阅信息失败:', error);
    }
  };

  const handleTopupClick = (tier: any) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setSelectedTier(tier);
    setIsQRCodeModalOpen(true);
  };

  const handleQRCodeTopup = async (receiptFileKey: string) => {
    if (!user || !selectedTier) return;

    try {
      const token = await createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      const topupResponse = await fetch('/api/user/topup-qrcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tierId: selectedTier.id,
          receiptFileKey,
        }),
      });

      if (!topupResponse.ok) {
        throw new Error('充值失败');
      }

      const topupData = await topupResponse.json();

      toast.success('充值订单已提交，请等待管理员审核');

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('充值失败:', error);
      toast.error('充值失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-black">
            股票智能分析
          </h1>
          <div className="flex gap-4">
            {user ? (
              <>
                <Link href="/">
                  <Button variant="ghost" className="text-gray-700 hover:bg-gray-50">
                    返回首页
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  退出登录
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-700 hover:bg-gray-50">
                    登录
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-black text-white hover:bg-gray-800">
                    注册
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* User Stats */}
      {subscription && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Zap className="w-4 h-4 text-black" />
                <span>免费额度: {subscription.usage.freeQuotaRemaining}/{FREE_QUOTA}</span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-2 text-gray-700">
                <TrendingUp className="w-4 h-4 text-black" />
                <span>积分: {subscription.usage.creditsRemaining}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Topup Method Notice */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center text-sm">
            <span className="text-green-700">
              💰 当前支持扫码充值：选择档位后扫码支付，上传支付凭证，管理员审核后自动增加积分。
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-semibold text-black mb-3">
              灵活充值，按需使用
            </h2>
            <p className="text-gray-600">
              每月{FREE_QUOTA}次免费分析，超出后按积分充值，积分永久有效
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {CREDITS_TIERS.map((tier) => (
              <Card
                key={tier.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  tier.popular
                    ? 'border-2 border-black bg-white'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {tier.popular && (
                  <div className="bg-black text-white text-xs font-medium px-3 py-1 text-center">
                    推荐
                  </div>
                )}

                <CardHeader className={tier.popular ? 'pt-8' : 'pt-8'}>
                  <div className="flex items-center gap-3 mb-2">
                    {tier.id === 'credits_10' ? (
                      <Zap className="w-8 h-8 text-black" />
                    ) : (
                      <TrendingUp className="w-8 h-8 text-black" />
                    )}
                    <div>
                      <CardTitle className="text-xl text-black">{tier.name}</CardTitle>
                      <CardDescription className="text-gray-500">
                        {tier.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="mb-6">
                    <span className="text-4xl font-semibold text-black">
                      ¥{tier.price}
                    </span>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">获得积分</span>
                      <span className="font-medium text-black">{tier.credits} 积分</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">单价</span>
                      <span className="font-medium text-black">¥{tier.unitPrice.toFixed(2)}/股</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">优惠</span>
                      <span className="font-medium text-gray-900">{tier.discount}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-8">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-black flex-shrink-0" />
                      <span className="text-gray-700">积分永久有效</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-black flex-shrink-0" />
                      <span className="text-gray-700">可累积使用</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-black flex-shrink-0" />
                      <span className="text-gray-700">所有分析功能</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-black flex-shrink-0" />
                      <span className="text-gray-700">支持Excel批量上传</span>
                    </div>
                  </div>

                  <Button
                    className={`w-full ${
                      tier.popular
                        ? 'bg-black text-white hover:bg-gray-800'
                        : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleTopupClick(tier)}
                  >
                    {user ? '扫码充值' : '登录充值'}
                    <QrCode className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Free Tier */}
          <Card className="mb-12 border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-black" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-black mb-2">免费使用</h3>
                  <p className="text-gray-600 mb-4">注册即享每月免费额度</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-black flex-shrink-0" />
                      <span>每月免费分析额度: {FREE_QUOTA} 次</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-black flex-shrink-0" />
                      <span>包含完整分析功能</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-black flex-shrink-0" />
                      <span>支持Excel上传</span>
                    </div>
                    {!user && (
                      <Link href="/register">
                        <Button className="bg-black text-white hover:bg-gray-800 text-sm">
                          立即注册
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold text-black mb-6 text-center">常见问题</h3>
            <div className="space-y-4">
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-black mb-2">如何使用积分？</h4>
                  <p className="text-sm text-gray-600">
                    每分析一只股票消耗1积分。每月前{FREE_QUOTA}只股票使用免费额度，免费额度用完后自动扣除积分。
                  </p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-black mb-2">积分可以累积吗？</h4>
                  <p className="text-sm text-gray-600">
                    是的，积分可以累积使用，没有有效期限制。
                  </p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-black mb-2">如何充值？</h4>
                  <p className="text-sm text-gray-600">
                    登录后选择充值档位，点击"扫码充值"按钮，扫码支付后上传凭证。管理员审核通过后，积分会自动增加到您的账户。
                  </p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-black mb-2">积分可以累积吗？</h4>
                  <p className="text-sm text-gray-600">
                    是的，积分可以累积使用，没有有效期限制。
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* QRCode Topup Modal */}
      {selectedTier && (
        <QRCodeTopupModal
          open={isQRCodeModalOpen}
          onOpenChange={setIsQRCodeModalOpen}
          tierId={selectedTier.id}
          tierName={selectedTier.name}
          credits={selectedTier.credits}
          price={selectedTier.price}
          onConfirm={handleQRCodeTopup}
        />
      )}
    </div>
  );
}
