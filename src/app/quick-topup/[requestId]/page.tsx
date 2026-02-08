'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function MobileTopupActionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'need-login'>('loading');
  const [message, setMessage] = useState('');
  const [requestInfo, setRequestInfo] = useState<any>(null);
  const requestId = params.requestId;
  const action = searchParams.get('action'); // 'approve' or 'reject'

  useEffect(() => {
    if (action && requestId) {
      checkLoginAndHandleAction(action);
    } else {
      setStatus('error');
      setMessage('无效的请求参数');
    }
  }, [action, requestId]);

  const checkLoginAndHandleAction = async (actionType: string) => {
    // 检查是否登录
    const token = localStorage.getItem('token');

    if (!token) {
      setStatus('need-login');
      return;
    }

    try {
      // 先获取充值请求信息
      const infoResponse = await fetch(`/api/admin/topup-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!infoResponse.ok) {
        setStatus('error');
        setMessage('无法获取充值信息');
        return;
      }

      const infoData = await infoResponse.json();
      if (infoData.requests && infoData.requests.length > 0) {
        const request = infoData.requests.find((r: any) => r.id === parseInt(requestId as string));
        if (request) {
          setRequestInfo(request);
        }
      }

      // 执行审核操作
      const endpoint = actionType === 'approve'
        ? `/api/admin/topup/${requestId}/approve`
        : `/api/admin/topup/${requestId}/reject`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ remark: '飞书快速审核' }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(actionType === 'approve' ? '✅ 充值审核通过！积分已到账' : '❌ 充值审核已拒绝');
      } else {
        setStatus('error');
        setMessage(data.error || '操作失败，请检查权限');
      }
    } catch (error) {
      setStatus('error');
      setMessage('网络错误，请稍后重试');
    }
  };

  const handleLogin = () => {
    // 保存当前页面地址，登录后返回
    const currentUrl = `/quick-topup/${requestId}?action=${action}`;
    localStorage.setItem('redirectUrl', currentUrl);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          <Link href="/admin/topup" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-black">充值审核</h1>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-lg mx-auto p-4">
        {status === 'loading' && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-black mb-2">正在处理...</h2>
            <p className="text-gray-600">请稍候</p>
          </div>
        )}

        {status === 'need-login' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-black mb-2">需要登录</h2>
              <p className="text-gray-600">请先登录后进行审核操作</p>
            </div>

            {requestInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-black mb-2">充值信息</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>用户邮箱: {requestInfo.email}</p>
                  <p>充值档位: {requestInfo.tierName}</p>
                  <p>积分数: {requestInfo.credits}</p>
                  <p>金额: ¥{requestInfo.price}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 mb-3"
            >
              立即登录
            </button>
            <Link
              href="/admin/topup"
              className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg font-medium hover:bg-gray-200"
            >
              取消
            </Link>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-black mb-2">操作成功</h2>
              <p className="text-gray-600">{message}</p>
            </div>

            {requestInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-black mb-2">审核信息</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>请求ID: {requestId}</p>
                  <p>用户邮箱: {requestInfo.email}</p>
                  <p>充值档位: {requestInfo.tierName}</p>
                  <p>积分: {requestInfo.credits}</p>
                </div>
              </div>
            )}

            <Link
              href="/admin/topup"
              className="block w-full bg-black text-white text-center py-3 rounded-lg font-medium hover:bg-gray-800 mb-3"
            >
              返回管理后台
            </Link>
            <button
              onClick={() => window.close()}
              className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg font-medium hover:bg-gray-200"
            >
              关闭窗口
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-black mb-2">操作失败</h2>
              <p className="text-gray-600">{message}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">可能的原因</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 未登录或登录已过期</li>
                <li>• 没有管理员权限</li>
                <li>• 网络连接问题</li>
                <li>• 请求已被处理</li>
              </ul>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 mb-3"
            >
              重新登录
            </button>
            <Link
              href="/admin/topup"
              className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg font-medium hover:bg-gray-200"
            >
              返回管理后台
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
