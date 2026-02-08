'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StockAnalysis {
  name: string;
  code: string;
  analysis: string;
  catalysts: string[];
  expectedNews: string[];
  businessInfo: string;
  orderCertainty: number;
  performanceContribution: string;
  technicalBarriers: string;
 热点关联: string;
  sources: string[];
  catalystScore: number;
}

export default function StockAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<StockAnalysis[]>([]);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    try {
      // 1. 上传文件到对象存储
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('文件上传失败');
      }

      const { fileKey } = await uploadResponse.json();

      // 2. 开始分析
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileKey }),
      });

      if (!analyzeResponse.ok) {
        throw new Error('分析失败');
      }

      // 3. 处理流式响应
      const reader = analyzeResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应');
      }

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setAnalyzing(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'result') {
                setResults(prev => [...prev, parsed.data]);
              } else if (parsed.type === 'error') {
                setError(parsed.message);
                setAnalyzing(false);
              }
            } catch (e) {
              console.error('解析响应失败:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    if (score >= 4) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return '高催化';
    if (score >= 6) return '中等催化';
    if (score >= 4) return '低催化';
    return '无催化';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            股票智能分析工具
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            上传包含个股信息的 Excel 文件，AI 将自动分析最近消息催化、炒作预期、订单确定性、业绩贡献、技术壁垒及热点关联性
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>上传分析文件</CardTitle>
            <CardDescription>
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
                className={`relative w-full h-32 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
                  ${isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-slate-300 hover:border-blue-500 dark:border-slate-700 dark:hover:border-blue-500'
                  }`}
              >
                <label
                  htmlFor="file-upload"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  {file ? (
                    <>
                      <FileText className="w-8 h-8 text-green-600" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${isDragging ? 'text-blue-600' : 'text-muted-foreground'}`}>
                        {isDragging ? '释放文件以上传' : '点击选择文件或拖拽到此处'}
                      </span>
                    </>
                  )}
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!file || analyzing}
                className="w-full"
                size="lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    正在分析中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    开始分析
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">分析结果</h2>
              <div className="text-sm text-muted-foreground">
                已完成 {results.length} 只股票分析
              </div>
            </div>

            {results.map((stock, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {stock.name}
                        <span className="text-sm font-normal text-muted-foreground">
                          ({stock.code})
                        </span>
                      </CardTitle>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(
                        stock.catalystScore
                      )}`}
                    >
                      {getScoreLabel(stock.catalystScore)} - {stock.catalystScore}/10
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* 消息催化 */}
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      消息催化
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {stock.catalysts.map((catalyst, i) => (
                        <li key={i}>{catalyst}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 可炒作的消息预期 */}
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      可炒作的消息预期
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {stock.expectedNews.map((news, i) => (
                        <li key={i}>{news}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 业务信息 */}
                  <div>
                    <h3 className="font-semibold mb-2">业务信息</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {stock.businessInfo}
                    </p>
                  </div>

                  {/* 订单确定性 */}
                  <div>
                    <h3 className="font-semibold mb-2">订单确定性</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${stock.orderCertainty * 10}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{stock.orderCertainty}/10</span>
                    </div>
                  </div>

                  {/* 业绩贡献 */}
                  <div>
                    <h3 className="font-semibold mb-2">业绩贡献</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {stock.performanceContribution}
                    </p>
                  </div>

                  {/* 技术壁垒 */}
                  <div>
                    <h3 className="font-semibold mb-2">技术壁垒</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {stock.technicalBarriers}
                    </p>
                  </div>

                  {/* 热点关联 */}
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      热点事件与题材关联
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {stock.热点关联}
                    </p>
                  </div>

                  {/* 信息来源 */}
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2 text-sm">信息来源</h3>
                    <div className="space-y-1">
                      {stock.sources.map((source, i) => (
                        <a
                          key={i}
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-blue-600 hover:underline truncate"
                        >
                          {source}
                        </a>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Loading Indicator */}
        {analyzing && results.length === 0 && (
          <Card className="mt-8">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <p className="text-muted-foreground">正在分析股票数据，请稍候...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
