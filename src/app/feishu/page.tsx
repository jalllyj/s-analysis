'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft, Shield } from 'lucide-react';

export default function FeishuAppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        // 未登录，跳转到飞书登录
        initiateFeishuLogin();
        return;
      }

      // 验证 token
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setLoading(false);
      } else {
        // token 无效，跳转到飞书登录
        initiateFeishuLogin();
      }
    } catch (error) {
      console.error('认证检查失败:', error);
      initiateFeishuLogin();
    }
  };

  const initiateFeishuLogin = () => {
    const FEISHU_APP_ID = process.env.NEXT_PUBLIC_FEISHU_APP_ID || 'cli_a90278570b38dcc7';
    const REDIRECT_URI = encodeURIComponent(window.location.origin + '/api/feishu/oauth/callback');

    // 构建飞书 OAuth URL
    const oauthUrl = `https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=${FEISHU_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=contact.user.base:readonly&state=/admin/topup`;

    window.location.href = oauthUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-black mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 飞书应用头部 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-black">充值审核系统</h1>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-4xl mx-auto p-4">
        <Card className="p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black">欢迎，{user?.name}</h2>
              <p className="text-sm text-gray-600">您有管理员权限</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/admin/topup')}
              className="w-full justify-start"
            >
              💰 充值审核
            </Button>

            <Button
              onClick={() => router.push('/admin/users')}
              variant="outline"
              className="w-full justify-start"
            >
              👥 用户管理
            </Button>

            <Button
              onClick={() => router.push('/admin/analytics')}
              variant="outline"
              className="w-full justify-start"
            >
              📊 数据统计
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-black mb-3">最近动态</h3>
          <p className="text-sm text-gray-600">
            暂无新的充值请求
          </p>
        </Card>
      </div>
    </div>
  );
}
