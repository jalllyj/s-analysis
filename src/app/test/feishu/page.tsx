'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function FeishuTestPage() {
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 获取诊断信息
      const diagnosticResponse = await fetch('/api/test/feishu');
      const diagnosticData = await diagnosticResponse.json();

      // 发送测试消息
      const testResponse = await fetch('/api/test/feishu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
        }),
      });

      const testData = await testResponse.json();

      setResult({
        diagnostic: diagnosticData.diagnostic,
        testResult: testData,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkWebhookConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/feishu');
      const data = await response.json();
      setResult({ diagnostic: data.diagnostic });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">飞书通知诊断工具</h1>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试配置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">测试邮箱</label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={runTest} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                发送测试消息
              </Button>
              <Button onClick={checkWebhookConfig} variant="outline" disabled={loading}>
                检查配置
              </Button>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">错误</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {result && (
          <Card className="p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <h3 className="font-semibold text-green-900">诊断结果</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Webhook 配置</h4>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(result.diagnostic, null, 2)}
                </pre>
              </div>

              {result.testResult && (
                <div>
                  <h4 className="font-semibold mb-2">测试消息结果</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(result.testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">故障排查指南</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold">1.</span>
              <div>
                <strong>检查飞书机器人配置</strong>
                <p className="text-gray-600 mt-1">
                  在飞书开放平台检查 Webhook URL 是否正确，机器人是否被启用
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">2.</span>
              <div>
                <strong>检查群组设置</strong>
                <p className="text-gray-600 mt-1">
                  确认 Webhook URL 对应的群组是正确的，机器人已被添加到群组
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">3.</span>
              <div>
                <strong>查看飞书群聊</strong>
                <p className="text-gray-600 mt-1">
                  消息可能发送成功但显示在其他位置，请检查群组历史消息
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">4.</span>
              <div>
                <strong>重新生成 Webhook</strong>
                <p className="text-gray-600 mt-1">
                  如果 Webhook URL 已失效，请在飞书开放平台重新生成
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
