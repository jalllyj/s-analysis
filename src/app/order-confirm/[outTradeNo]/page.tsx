'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertCircle, ArrowLeft, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import Link from 'next/link';
import { createToken } from '@/lib/auth';
import { toast } from 'sonner';

export default function OrderConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const outTradeNo = params.outTradeNo as string;

  const [user, setUser] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchOrderStatus();
  }, [outTradeNo]);

  const fetchOrderStatus = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userData);
      const token = await createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      const response = await fetch(`/api/orders/query?outTradeNo=${outTradeNo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('查询订单失败');
      }

      const data = await response.json();
      setOrder(data.order);

      if (data.order?.status === 'completed') {
        toast.success('支付成功！积分已增加');
        setTimeout(() => {
          router.push('/pricing');
        }, 2000);
      }
    } catch (error) {
      console.error('查询订单失败:', error);
      toast.error('查询订单失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentUrl = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userData);
      const token = await createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      // 根据订单信息推断充值档位
      let tierId = 'credits_10';
      if (order.credits === 50) {
        tierId = 'credits_50';
      }

      const response = await fetch('/api/user/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tierId }),
      });

      if (!response.ok) {
        throw new Error('获取支付链接失败');
      }

      const data = await response.json();
      if (data.paymentUrl) {
        window.open(data.paymentUrl, '_blank');
      } else {
        throw new Error('支付链接无效');
      }
    } catch (error) {
      console.error('获取支付链接失败:', error);
      toast.error('获取支付链接失败');
    }
  };

  const handleConfirmOrder = async () => {
    setIsConfirming(true);

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userData);
      const token = await createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      const response = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ outTradeNo }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }));
        throw new Error(errorData.error || '确认订单失败');
      }

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || '订单确认成功');
        fetchOrderStatus();
      } else {
        toast.warning(data.message || '订单未支付');
      }
    } catch (error) {
      console.error('确认订单失败:', error);
      const errorMessage = error instanceof Error ? error.message : '确认订单失败';
      toast.error(errorMessage);
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">订单不存在</h3>
              <p className="text-sm text-gray-600 mb-4">未找到订单信息</p>
              <Link href="/pricing">
                <Button className="bg-black text-white hover:bg-gray-800">
                  返回充值页面
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (order.status === 'completed') {
      return <CheckCircle2 className="w-16 h-16 text-green-500" />;
    }
    if (order.status === 'pending') {
      return <Clock className="w-16 h-16 text-yellow-500" />;
    }
    return <AlertCircle className="w-16 h-16 text-red-500" />;
  };

  const getStatusText = () => {
    if (order.status === 'completed') return '支付成功';
    if (order.status === 'pending') return '等待支付';
    return '支付失败';
  };

  const getStatusDesc = () => {
    if (order.status === 'completed') return '积分已成功增加到您的账户';
    if (order.status === 'pending') return '请在支付宝完成支付后，点击下方按钮确认订单';
    return '订单支付失败，请重新充值';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center">
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回充值
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-gray-200 bg-white">
            <CardHeader className="text-center">
              {getStatusIcon()}
              <CardTitle className="text-2xl text-black mt-4">
                {getStatusText()}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {getStatusDesc()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">订单号</span>
                  <span className="font-mono text-black">{order.transactionId}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">充值金额</span>
                  <span className="font-semibold text-black">¥{order.amount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">获得积分</span>
                  <span className="font-semibold text-black flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {order.credits} 积分
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">订单状态</span>
                  <span className={`font-medium ${
                    order.status === 'completed' ? 'text-green-600' :
                    order.status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {getStatusText()}
                  </span>
                </div>
                {order.createdAt && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">创建时间</span>
                    <span className="text-gray-700">
                      {new Date(order.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                )}
                {order.completedAt && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">完成时间</span>
                    <span className="text-gray-700">
                      {new Date(order.completedAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {order.status === 'pending' && (
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      // 跳转到订单创建页面获取支付链接
                      router.push(`/pricing?tierId=${order.credits === 10 ? 'credits_10' : 'credits_50'}`);
                    }}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    跳转支付宝支付
                  </Button>

                  <Button
                    onClick={handleConfirmOrder}
                    disabled={isConfirming}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {isConfirming ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        查询中...
                      </>
                    ) : (
                      '查询订单状态'
                    )}
                  </Button>

                  <p className="text-sm text-gray-500 text-center">
                    支付成功后，点击"查询订单状态"按钮确认并增加积分
                  </p>
                </div>
              )}

              {order.status === 'completed' && (
                <Link href="/pricing">
                  <Button className="w-full bg-black text-white hover:bg-gray-800">
                    返回充值页面
                  </Button>
                </Link>
              )}

              {/* Help */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  💡 如何完成支付？
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>点击"跳转支付宝支付"按钮</li>
                  <li>在支付宝完成支付</li>
                  <li>支付成功后，点击"查询订单状态"按钮</li>
                  <li>确认成功后，积分会自动增加到您的账户</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
