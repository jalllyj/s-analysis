'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TopupActionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const requestId = params.requestId;
  const action = searchParams.get('action'); // 'approve' or 'reject'

  useEffect(() => {
    if (action && requestId) {
      handleAction(action);
    } else {
      setStatus('error');
      setMessage('无效的请求参数');
    }
  }, [action, requestId]);

  const handleAction = async (actionType: string) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setStatus('error');
        setMessage('未登录，请先登录');
        return;
      }

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
        setMessage(actionType === 'approve' ? '充值审核通过！' : '充值审核已拒绝');
      } else {
        setStatus('error');
        setMessage(data.error || '操作失败');
      }
    } catch (error) {
      setStatus('error');
      setMessage('操作失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        {status === 'loading' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-black mb-2">正在处理...</h2>
            <p className="text-gray-600">请稍候</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-black mb-2">✅ 操作成功</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-6">请求ID: {requestId}</p>
            <div className="space-y-3">
              <Link
                href="/admin/topup"
                className="block w-full bg-black text-white text-center py-3 rounded-lg hover:bg-gray-800"
              >
                返回管理后台
              </Link>
              <button
                onClick={() => window.close()}
                className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-200"
              >
                关闭窗口
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-black mb-2">❌ 操作失败</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/admin/topup"
                className="block w-full bg-black text-white text-center py-3 rounded-lg hover:bg-gray-800"
              >
                返回管理后台
              </Link>
              <Link
                href="/login"
                className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-200"
              >
                前往登录
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
