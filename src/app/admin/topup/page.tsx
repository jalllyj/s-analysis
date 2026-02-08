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
  adminId: number | null;
  adminRemark: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TopupManagementPage() {
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEmail, setFilterEmail] = useState<string>('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  // 获取充值请求列表
  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        ...(filterEmail && { email: filterEmail }),
      });

      const response = await fetch(`/api/admin/topup-requests?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRequests(data.requests || []);
      } else {
        console.error('获取充值请求失败:', data.error);
      }
    } catch (error) {
      console.error('获取充值请求出错:', error);
    } finally {
      setLoading(false);
    }
  };

  // 审核通过
  const handleApprove = async (requestId: number) => {
    const remark = prompt('请输入审核备注（可选）：');
    if (remark !== null) {
      await processRequest(requestId, 'approve', remark);
    }
  };

  // 拒绝审核
  const handleReject = async (requestId: number) => {
    const remark = prompt('请输入拒绝原因（可选）：');
    if (remark !== null) {
      await processRequest(requestId, 'reject', remark);
    }
  };

  // 处理审核请求
  const processRequest = async (requestId: number, action: 'approve' | 'reject', remark: string) => {
    setProcessingId(requestId);

    try {
      const response = await fetch(`/api/admin/topup/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ remark }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
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

  useEffect(() => {
    fetchRequests();
  }, [filterStatus, filterEmail]);

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
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">充值审核管理</h1>
          <p className="text-gray-600">查看和管理用户的充值请求</p>
        </div>

        {/* 筛选栏 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态筛选</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">全部</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱搜索</label>
              <input
                type="text"
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                placeholder="输入用户邮箱"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div className="flex-1"></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">统计</label>
              <div className="flex gap-2 text-sm">
                <span className="px-2 py-1 bg-gray-100 rounded">
                  待审核: {requests.filter(r => r.status === 'pending').length}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                  今日: {requests.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 充值请求列表 */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">暂无充值请求</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
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
                            className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 disabled:opacity-50"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            拒绝
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
        )}
      </div>
    </div>
  );
}
