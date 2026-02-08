'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XCircle, Loader2, AlertCircle } from 'lucide-react';

export default function QuickRejectPage() {
  const params = useParams();
  const requestId = params.requestId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requestInfo, setRequestInfo] = useState<any>(null);

  useEffect(() => {
    handleReject();
  }, []);

  const handleReject = async () => {
    try {
      setLoading(true);
      setError(null);

      // 先生成 token
      const tokenResponse = await fetch(`/api/admin/topup/${requestId}/approve-token`, {
        method: 'POST',
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || '生成 token 失败');
      }

      const tokenData = await tokenResponse.json();
      const token = tokenData.token;

      // 使用 token 进行拒绝
      const rejectResponse = await fetch(`/api/admin/topup/${requestId}/quick-reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-gray-900">操作失败</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.close()} variant="outline">
            关闭页面
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
          <Button onClick={() => window.close()} className="w-full">
            关闭页面
          </Button>
        </Card>
      </div>
    );
  }

  return null;
}
