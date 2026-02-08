'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createToken } from '@/lib/auth';

export default function TopupTestPage() {
  const [user, setUser] = useState<any>(null);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [tierId, setTierId] = useState('credits_10');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      addLog('✓ 用户已登录: ' + JSON.parse(userData).email);
    } else {
      addLog('✗ 用户未登录');
    }
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleTestUpload = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (!receiptImage) {
      toast.error('请选择支付凭证');
      return;
    }

    setLoading(true);
    setLogs([]);

    try {
      addLog('=== 开始测试充值流程 ===');
      addLog(`选择档位: ${tierId}`);

      // 步骤 1: 创建 Token
      addLog('步骤 1: 创建认证 Token...');
      const token = await createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
      addLog('✓ Token 创建成功');

      // 步骤 2: 上传支付凭证
      addLog('步骤 2: 上传支付凭证...');
      const formData = new FormData();
      formData.append('file', receiptImage);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      addLog(`上传响应状态: ${uploadResponse.status}`);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        addLog(`✗ 上传失败: ${errorText}`);
        throw new Error('上传支付凭证失败');
      }

      const uploadData = await uploadResponse.json();
      addLog(`✓ 支付凭证已上传: ${uploadData.fileKey}`);

      // 步骤 3: 提交充值请求
      addLog('步骤 3: 提交充值请求...');
      const topupResponse = await fetch('/api/user/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tierId: tierId,
          receiptFileKey: uploadData.fileKey,
        }),
      });

      addLog(`充值请求响应状态: ${topupResponse.status}`);

      if (!topupResponse.ok) {
        const errorData = await topupResponse.json();
        addLog(`✗ 充值请求失败: ${JSON.stringify(errorData)}`);
        throw new Error(errorData.error || '充值请求提交失败');
      }

      const topupData = await topupResponse.json();
      addLog(`✓ 充值请求成功创建: 请求ID ${topupData.topupRequest.id}`);
      addLog('✓ 飞书通知已发送');

      addLog('=== 测试完成 ===');
      toast.success('充值请求提交成功');
    } catch (error: any) {
      addLog(`✗ 错误: ${error.message}`);
      console.error('测试充值失败:', error);
      toast.error(error.message || '充值失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">充值功能测试</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>用户状态</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2">
                <div><strong>邮箱:</strong> {user.email}</div>
                <div><strong>用户ID:</strong> {user.id}</div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>已登录</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>未登录</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>充值参数</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>充值档位</Label>
              <select
                value={tierId}
                onChange={(e) => setTierId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="credits_10">入门包 (10 积分, ¥5)</option>
                <option value="credits_50">经济包 (50 积分, ¥20)</option>
              </select>
            </div>

            <div>
              <Label>支付凭证</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setReceiptImage(file);
                      addLog(`已选择文件: ${file.name}`);
                    }
                  }}
                  className="w-full"
                />
              </div>
              {receiptImage && (
                <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{receiptImage.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 mb-6">
          <Button
            onClick={handleTestUpload}
            disabled={loading || !user || !receiptImage}
            className="flex-1"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            测试充值流程
          </Button>
        </div>

        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>执行日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
