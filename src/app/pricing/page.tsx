'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Zap, TrendingUp, Sparkles, ArrowRight, Shield, Clock, Gift } from 'lucide-react';
import Link from 'next/link';
import { CREDITS_TIERS, FREE_QUOTA } from '@/lib/pricing';
import { createToken } from '@/lib/auth';
import TopupModal from '@/components/TopupModal';
import { toast } from 'sonner';

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(true);
  };

  const handleTopupConfirm = async (receiptImage?: File) => {
    if (!user || !selectedTier) return;

    try {
      const token = await createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      // 如果有支付凭证，先上传
      let receiptFileKey = '';
      if (receiptImage) {
        const formData = new FormData();
        formData.append('file', receiptImage);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('上传支付凭证失败');
        }

        const uploadData = await uploadResponse.json();
        receiptFileKey = uploadData.fileKey;
      }

      // 调用充值API
      const topupResponse = await fetch('/api/user/topup', {
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

      toast.success(`充值成功！已获得 ${topupData.creditsAdded} 积分`);

      // 刷新页面以更新积分显示
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('充值失败:', error);
      toast.error('充值失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            股票智能分析
          </h1>
          <div className="flex gap-4">
            {user ? (
              <>
                <Link href="/">
                  <Button variant="ghost" className="text-white hover:text-white">
                    返回首页
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }}
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  退出登录
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-white hover:text-white">
                    登录
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    注册
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Stats */}
      {subscription && (
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-8 text-white">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm">免费额度: {subscription.usage.freeQuotaRemaining}/{FREE_QUOTA}</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-sm">积分: {subscription.usage.creditsRemaining}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 text-white">
            灵活充值，按需使用
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            每月{FREE_QUOTA}次免费分析，超出后按积分充值，积分永久有效
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {CREDITS_TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={`relative overflow-hidden transition-all hover:scale-105 ${
                tier.popular
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-0 shadow-2xl'
                  : 'bg-white/10 backdrop-blur-lg border-white/20'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-4 py-2 text-sm font-bold text-center">
                  最受欢迎
                </div>
              )}

              <CardHeader className={tier.popular ? 'text-white pt-8' : 'text-white pt-8'}>
                <div className="flex items-center gap-3 mb-2">
                  {tier.id === 'credits_10' ? (
                    <Zap className="w-10 h-10" />
                  ) : (
                    <Sparkles className="w-10 h-10" />
                  )}
                  <div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription className={tier.popular ? 'text-white/80' : 'text-gray-300'}>
                      {tier.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <div className="mb-6">
                  <span className={`text-5xl font-bold ${tier.popular ? 'text-white' : 'text-white'}`}>
                    ¥{tier.price}
                  </span>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${tier.popular ? 'text-white/70' : 'text-gray-300'}`}>获得积分</span>
                    <span className={`text-xl font-semibold ${tier.popular ? 'text-white' : 'text-white'}`}>
                      {tier.credits} 积分
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${tier.popular ? 'text-white/70' : 'text-gray-300'}`}>单价</span>
                    <span className={`font-semibold ${tier.popular ? 'text-yellow-300' : 'text-yellow-300'}`}>
                      ¥{tier.unitPrice.toFixed(2)}/股
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${tier.popular ? 'text-white/70' : 'text-gray-300'}`}>优惠</span>
                    <span className={`font-semibold ${tier.popular ? 'text-green-300' : 'text-green-300'}`}>
                      {tier.discount}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className={`text-sm ${tier.popular ? 'text-white' : 'text-gray-300'}`}>积分永久有效</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className={`text-sm ${tier.popular ? 'text-white' : 'text-gray-300'}`}>可累积使用</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className={`text-sm ${tier.popular ? 'text-white' : 'text-gray-300'}`}>所有分析功能</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className={`text-sm ${tier.popular ? 'text-white' : 'text-gray-300'}`}>支持Excel批量上传</span>
                  </div>
                </div>

                <Button
                  className={`w-full h-12 text-lg ${
                    tier.popular
                      ? 'bg-white text-blue-600 hover:bg-gray-100'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                  }`}
                  onClick={() => handleTopupClick(tier)}
                >
                  {user ? '立即充值' : '登录充值'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-white text-center">为什么选择我们？</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">安全可靠</h4>
                <p className="text-sm text-gray-300">数据加密存储，保障您的隐私安全</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6 text-center">
                <Clock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">即时到账</h4>
                <p className="text-sm text-gray-300">支付完成后积分立即到账，无需等待</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6 text-center">
                <Gift className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">免费额度</h4>
                <p className="text-sm text-gray-300">每月{FREE_QUOTA}次免费分析，畅享基础服务</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-white text-center">常见问题</h3>
          <div className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-white mb-2">如何使用积分？</h4>
                <p className="text-sm text-gray-300">
                  每分析一只股票消耗1积分。每月前{FREE_QUOTA}只股票使用免费额度，免费额度用完后自动扣除积分。
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-white mb-2">积分可以累积吗？</h4>
                <p className="text-sm text-gray-300">
                  是的，积分可以累积使用，没有有效期限制。
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-white mb-2">如何充值？</h4>
                <p className="text-sm text-gray-300">
                  登录后选择充值档位，扫码支付后点击确认已支付即可。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Topup Modal */}
      {selectedTier && (
        <TopupModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          tierId={selectedTier.id}
          tierName={selectedTier.name}
          credits={selectedTier.credits}
          price={selectedTier.price}
          onConfirm={handleTopupConfirm}
        />
      )}
    </div>
  );
}
