'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2, TrendingUp, AlertCircle, CheckCircle2, Flame, LogOut, CreditCard, Zap, X } from 'lucide-react';
import Link from 'next/link';
import { createToken } from '@/lib/auth';

interface StockAnalysis {
  name: string;
  code: string;
  analysis: string;
  catalysts: string[];
  catalystScore: number;
  isCoreStock: boolean;
  marketPosition: string;
}

export default function StockAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<StockAnalysis[]>([]);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchSubscription();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchSubscription = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const token = await createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      const response = await fetch('/api/user/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('获取订阅信息失败:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('请上传 Excel 文件（.xlsx 或 .xls）');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.xlsx') && !droppedFile.name.endsWith('.xls')) {
        setError('请上传 Excel 文件（.xlsx 或 .xls）');
        return;
      }
      setFile(droppedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('请先选择文件');
      return;
    }

    setAnalyzing(true);
    setError('');
    setResults([]);
    setProgressMessage('正在上传文件...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: '未知错误' }));
        throw new Error(`文件上传失败: ${errorData.error || uploadResponse.statusText}`);
      }

      const { fileKey } = await uploadResponse.json();

      setProgressMessage('文件上传成功，开始分析...');

      const token = await createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fileKey }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json().catch(() => ({ error: '未知错误' }));
        throw new Error(errorData.error || '分析失败');
      }

      const data = await analyzeResponse.json();
      setResults(data.results || data.analyses || []);
      setProgressMessage('分析完成！');

      // 刷新订阅信息
      fetchSubscription();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '分析失败，请重试';
      setError(errorMessage);
      console.error('分析失败:', error);
    } finally {
      setAnalyzing(false);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return '高催化';
    if (score >= 6) return '中等催化';
    if (score >= 4) return '低催化';
    return '无催化';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-black">
            股票智能分析
          </h1>
          <div className="flex items-center gap-4">
            {subscription?.usage && (
              <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-black" />
                  <span className="text-sm text-gray-700">
                    {subscription.usage.freeQuotaRemaining}/{subscription.usage.monthlyFreeQuota}
                  </span>
                </div>
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-black" />
                  <span className="text-sm text-gray-700">
                    {subscription.usage.creditsRemaining}
                  </span>
                </div>
              </div>
            )}
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <CreditCard className="w-4 h-4 mr-2" />
                充值积分
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-black mb-2">股票智能分析工具</h1>
            <p className="text-gray-600">
              上传包含个股信息的 Excel 文件，AI 将自动分析核心个股识别、产品价格催化、炒作预期、订单确定性、业绩贡献、技术壁垒及热点关联性
            </p>
          </div>

          {/* Upload Section */}
          <Card className="mb-8 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-black">上传分析文件</CardTitle>
              <CardDescription className="text-gray-500">
                请上传包含股票名称和代码的 Excel 文件（.xlsx 或 .xls）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative w-full h-40 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
                    ${isDragging
                      ? 'border-black bg-gray-50'
                      : 'border-gray-300 hover:border-black bg-gray-50'
                    }`}
                >
                  <label htmlFor="file-upload" className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer">
                    {file ? (
                      <>
                        <FileText className="w-8 h-8 text-black" />
                        <span className="text-sm font-medium text-black">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            setFile(null);
                          }}
                          className="text-gray-600 hover:text-black"
                        >
                          <X className="w-4 h-4 mr-1" />
                          取消
                        </Button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          拖拽文件到此处，或点击上传
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={!file || analyzing}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {progressMessage}
                    </>
                  ) : (
                    '开始分析'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-black" />
                <h2 className="text-xl font-semibold text-black">分析结果</h2>
                <span className="text-sm text-gray-500">({results.length} 只股票)</span>
              </div>

              {results.map((stock, index) => (
                <Card key={index} className="border-gray-200 bg-white">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-black text-lg">
                          {stock.name} ({stock.code})
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                          {stock.marketPosition}
                        </CardDescription>
                      </div>
                      {stock.isCoreStock && (
                        <span className="px-3 py-1 text-xs font-medium bg-black text-white rounded">
                          核心个股
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-black mb-2">综合分析</h4>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {stock.analysis}
                      </p>
                    </div>

                    {stock.catalysts && stock.catalysts.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">催化因素</h4>
                        <ul className="space-y-1">
                          {stock.catalysts.map((catalyst, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
                              <span>{catalyst}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">催化评分:</span>
                        <span className="text-sm font-medium text-black">
                          {stock.catalystScore?.toFixed(1) || '-'}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {getScoreLabel(stock.catalystScore)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
