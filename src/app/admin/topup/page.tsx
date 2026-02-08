'use client';

import { useEffect, useState } from 'react';

interface TopupRequest {
  id: number;
  userId: number;
  email: string;
  tierId: string;
  tierName: string;
  credits: number;
  price: string;
  receiptFileKey: string | null;
  status: 'pending' | 'approved' | 'rejected';
  adminRemark: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TopupManagementPage() {
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [processingId, setProcessingId] = useState<number | null>(null);

  // 获取充值请求列表
  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams({
        status: filterStatus,
      });

      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        window.location.href = '/login?redirect=/admin/topup';
        return;
      }

      const response = await fetch(`/api/admin/topup-requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setRequests(data.requests || []);
      } else {
        if (response.status === 401) {
          alert('登录已过期，请重新登录');
          window.location.href = '/login?redirect=/admin/topup';
        } else {
          console.error('获取充值请求失败:', data.error);
          alert('获取充值请求失败');
        }
      }
    } catch (error) {
      console.error('获取充值请求出错:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 审核通过
  const handleApprove = async (requestId: number) => {
    if (!confirm('确定要通过这个充值请求吗？')) {
      return;
    }

    setProcessingId(requestId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/topup/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ remark: '飞书通知审核' }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ 审核通过，积分已到账');
        await fetchRequests(); // 刷新列表
      } else {
        alert(`操作失败: ${data.error}`);
      }
    } catch (error) {
      console.error('审核请求出错:', error);
      alert('操作失败，请稍后重试');
    } finally {
      setProcessingId(null);
    }
  };

  // 拒绝审核
  const handleReject = async (requestId: number) => {
    const remark = prompt('请输入拒绝原因：');
    if (!remark) {
      return;
    }

    setProcessingId(requestId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/topup/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ remark }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('❌ 审核已拒绝');
        await fetchRequests(); // 刷新列表
      } else {
        alert(`操作失败: ${data.error}`);
      }
    } catch (error) {
      console.error('审核请求出错:', error);
      alert('操作失败，请稍后重试');
    } finally {
      setProcessingId(null);
    }
  };

  // 查看支付凭证
  const viewReceipt = async (requestId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/topup/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.request.receiptFileKey) {
        window.open(data.request.receiptFileKey, '_blank');
      } else {
        alert('未找到支付凭证');
      }
    } catch (error) {
      console.error('查看凭证出错:', error);
      alert('查看凭证失败');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  // 获取状态标签样式
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    const labels = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">充值审核管理</h1>
        <p className="text-gray-600">查看和管理用户的充值请求</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">待审核</p>
              <p className="text-3xl font-bold text-yellow-600">
                {requests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">已通过</p>
              <p className="text-3xl font-bold text-green-600">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总请求</p>
              <p className="text-3xl font-bold text-blue-600">
                {requests.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">状态筛选</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">全部</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <button
            onClick={fetchRequests}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            刷新列表
          </button>
        </div>
      </div>

      {/* 充值请求列表 */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📭</span>
          </div>
          <p className="text-gray-500 text-lg">暂无充值请求</p>
          <p className="text-gray-400 text-sm mt-2">当用户提交充值后，会在这里显示</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* 移动端卡片视图 */}
          <div className="md:hidden space-y-4 p-4">
            {requests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{request.email}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(request.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">档位：</span>
                      <span className="font-medium">{request.tierName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">积分：</span>
                      <span className="font-medium">{request.credits}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">金额：</span>
                      <span className="font-medium">¥{request.price}</span>
                    </div>
                  </div>
                </div>
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={processingId === request.id}
                      className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                    >
                      {processingId === request.id ? '处理中...' : '通过'}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={processingId === request.id}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      {processingId === request.id ? '处理中...' : '拒绝'}
                    </button>
                  </div>
                )}
                {request.receiptFileKey && (
                  <button
                    onClick={() => viewReceipt(request.id)}
                    className="w-full mt-2 text-blue-600 text-sm hover:text-blue-800"
                  >
                    查看支付凭证
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 桌面端表格视图 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户邮箱</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">充值档位</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">积分数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.tierName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.credits}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{request.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {request.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={processingId === request.id}
                            className="px-4 py-2 bg-black text-white text-xs rounded-lg hover:bg-gray-800 disabled:opacity-50 font-medium"
                          >
                            {processingId === request.id ? '处理中...' : '通过'}
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                            className="px-4 py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                          >
                            {processingId === request.id ? '处理中...' : '拒绝'}
                          </button>
                        </div>
                      ) : request.adminRemark ? (
                        <span className="text-xs text-gray-500">{request.adminRemark}</span>
                      ) : (
                        <span className="text-xs text-gray-400">无操作</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
