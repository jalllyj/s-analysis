'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XCircle, Loader2, AlertCircle, Shield } from 'lucide-react';

export default function FeishuRejectPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.requestId;

  const [loading, setLoading] = useState(true);
  const [needLogin, setNeedLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requestInfo, setRequestInfo] = useState<any>(null);

  useEffect(() => {
    handleReject();
  }, []);

  const initiateFeishuLogin = () => {
    const FEISHU_APP_ID = process.env.NEXT_PUBLIC_FEISHU_APP_ID || 'cli_a90278570b38dcc7';
    const REDIRECT_URI = encodeURIComponent(window.location.origin + '/api/feishu/oauth/callback');
    const currentState = encodeURIComponent(window.location.pathname);

    const oauthUrl = `https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=${FEISHU_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=contact.user.base:readonly&state=${currentState}`;

    window.location.href = oauthUrl;
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      setError(null);

      // 检查是否登录
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        setNeedLogin(true);
        setLoading(false);
        return;
      }

      // 先生成 token
      const tokenResponse = await fetch(`/api/admin/topup/${requestId}/approve-token`, {
        method: 'POST',
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || '生成 token 失败');
      }

      const tokenData = await tokenResponse.json();
      const rejectToken = tokenData.token;

      // 使用 token 进行拒绝
      const rejectResponse = await fetch(`/api/admin/topup/${requestId}/quick-reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: rejectToken }),
      });

      const rejectData = await rejectResponse.json();

      if (!rejectResponse.ok) {
        throw new Error(rejectData.error || '操作失败');
      }

      setRequestInfo(rejectData.request);
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || '操作失败');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Loader2 className="w-16 h-16 text-black mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold mb-2">正在处理...</h1>
          <p className="text-gray-600">请稍候</p>
        </Card>
      </div>
    );
  }

  if (needLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">需要登录</h1>
          <p className="text-gray-600 mb-6">
            请使用飞书账号登录以完成审核操作
          </p>
          <Button onClick={initiateFeishuLogin} className="w-full">
            飞书登录
          </Button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-gray-900">操作失败</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/feishu')} variant="outline">
            返回首页
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-gray-900">已拒绝</h1>
          <p className="text-gray-600 mb-4">
            用户 {requestInfo?.email} 的充值请求已拒绝
          </p>
          {requestInfo && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gray-900 mb-2">充值详情</p>
              <p className="text-sm text-gray-700">
                用户：{requestInfo.email}<br/>
                档位：{requestInfo.tierName}<br/>
                积分：{requestInfo.credits}<br/>
                金额：¥{requestInfo.price}
              </p>
            </div>
          )}
          <Button onClick={() => router.push('/feishu')} className="w-full">
            返回首页
          </Button>
        </Card>
      </div>
    );
  }

  return null;
}
