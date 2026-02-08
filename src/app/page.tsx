'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2, TrendingUp, AlertCircle, CheckCircle2, Star, Award, Calendar, Clock, Zap, FileCheck, DollarSign, User, Calendar as CalendarIcon, Shield, Flame } from 'lucide-react';

interface CatalystEvent {
  timeRange: string;
  event: string;
  importance: number;
  type: string;
  certainty: number;
  description: string;
}

interface OrderItem {
  projectName: string;
  orderAmount: string;
  customerName: string;
  contractDate: string;
  deliveryDate: string;
  orderCertainty: number;
  performanceContribution: string;
  technicalBarrier: string;
  priorityScore: number;
  status: string;
}

interface HotTopic {
  topicName: string;
  burstDate: string;
  relevance: number;
  connection: string;
  hasRealConnection: boolean;
}

interface StockAnalysis {
  name: string;
  code: string;
  analysis: string;
  catalysts: string[];
  catalystTimeline: CatalystEvent[];
  shortTermCatalysts: string[];
  mediumTermCatalysts: string[];
  longTermLogic: string;
  businessInfo: string;
  orderList: OrderItem[];
  hotTopics: HotTopic[];
  orderCertainty: number;
  performanceContribution: string;
  technicalBarriers: string;
  热点关联: string;
  sources: string[];
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
              setProgressMessage('');
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'result') {
                setResults(prev => [...prev, parsed.data]);
                setProgressMessage('');
              } else if (parsed.type === 'progress') {
                setProgressMessage(parsed.message);
              } else if (parsed.type === 'error') {
                setError(parsed.message);
                setAnalyzing(false);
                setProgressMessage('');
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
            上传包含个股信息的 Excel 文件，AI 将自动分析核心个股识别、产品价格催化、炒作预期、订单确定性、业绩贡献、技术壁垒及热点关联性
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

            {/* 总排序列表 */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  综合排序（按催化评分）
                </CardTitle>
                <CardDescription className="text-slate-300">
                  按催化评分从高到低排序，点击卡片查看详细分析
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {results
                    .sort((a, b) => b.catalystScore - a.catalystScore)
                    .map((stock, index) => (
                      <div
                        key={index}
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => {
                          const element = document.getElementById(`stock-detail-${index}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{stock.name}</h3>
                                <span className="text-sm text-muted-foreground">({stock.code})</span>
                                {stock.isCoreStock && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-semibold rounded-full">
                                    <Star className="w-3 h-3" />
                                    核心个股
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {stock.longTermLogic && (
                                  <span className="text-amber-600 dark:text-amber-400">
                                    大周期逻辑
                                  </span>
                                )}
                                {stock.hotTopics.filter(t => t.hasRealConnection).length > 0 && (
                                  <span className="text-red-600 dark:text-red-400">
                                    {stock.hotTopics.filter(t => t.hasRealConnection).length} 个热点
                                  </span>
                                )}
                                {stock.orderList.length > 0 && (
                                  <span className="text-green-600 dark:text-green-400">
                                    {stock.orderList.length} 个订单
                                  </span>
                                )}
                                {stock.shortTermCatalysts.length > 0 && (
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {stock.shortTermCatalysts.length} 个短期催化
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground mb-1">催化评分</div>
                              <div
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(
                                  stock.catalystScore
                                )}`}
                              >
                                {stock.catalystScore}/10
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground mb-1">订单确定性</div>
                              <div className="text-sm font-semibold">
                                {stock.orderCertainty}/10
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {results.map((stock, index) => (
              <Card key={index} id={`stock-detail-${index}`} className="overflow-hidden scroll-mt-4">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {stock.name}
                        <span className="text-sm font-normal text-muted-foreground">
                          ({stock.code})
                        </span>
                      </CardTitle>
                      {stock.isCoreStock && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-semibold rounded-full">
                          <Star className="w-3 h-3" />
                          核心个股
                        </div>
                      )}
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
                  {/* 综合分析摘要 */}
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      综合分析摘要
                    </h3>
                    <p className="text-sm text-muted-foreground">{stock.analysis}</p>
                  </div>

                  {/* 市场地位 */}
                  {stock.marketPosition && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-600" />
                        市场地位
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {stock.marketPosition}
                      </p>
                    </div>
                  )}

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

                  {/* 催化时间线 - 1-3个月 */}
                  {stock.shortTermCatalysts.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        1-3个月可炒作预期（短期催化）
                      </h3>
                      <div className="space-y-2">
                        {stock.shortTermCatalysts.map((catalyst, i) => (
                          <div
                            key={i}
                            className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                          >
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">
                              {catalyst}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 催化时间线 - 3-6个月 */}
                  {stock.mediumTermCatalysts.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        3-6个月核心催化（中期催化）
                      </h3>
                      <div className="space-y-2">
                        {stock.mediumTermCatalysts.map((catalyst, i) => (
                          <div
                            key={i}
                            className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                          >
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              {catalyst}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 大周期硬逻辑 */}
                  {stock.longTermLogic && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-600" />
                        大周期硬逻辑
                      </h3>
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border-2 border-amber-300 dark:border-amber-700">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 whitespace-pre-line">
                          {stock.longTermLogic}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 详细催化时间线 */}
                  {stock.catalystTimeline.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        详细催化时间线
                      </h3>
                      <div className="space-y-3">
                        {stock.catalystTimeline.map((event, i) => (
                          <div
                            key={i}
                            className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                  {event.timeRange}
                                </span>
                                <span className="px-2 py-1 text-xs font-medium rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                  {event.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  重要性: {event.importance}/10
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  确定性: {event.certainty}/10
                                </span>
                              </div>
                            </div>
                            <h4 className="font-semibold text-sm mb-1">{event.event}</h4>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 同花顺热点概念分析 */}
                  {stock.hotTopics.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-red-600" />
                        同花顺热点概念分析（最近5个交易日）
                      </h3>
                      <div className="space-y-3">
                        {stock.hotTopics
                          .filter(topic => topic.hasRealConnection)
                          .map((topic, i) => (
                            <div
                              key={i}
                              className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-lg border border-red-200 dark:border-red-800"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                    {topic.topicName}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <CalendarIcon className="w-3 h-3" />
                                    {topic.burstDate}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <Flame className="w-3 h-3 text-red-600" />
                                  <span className="font-semibold text-red-600 dark:text-red-400">
                                    关联度: {topic.relevance}/10
                                  </span>
                                </div>
                              </div>
                              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {topic.connection}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* 订单列表 */}
                  {stock.orderList.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-indigo-600" />
                        订单列表（按优先级排序：确定性→业绩贡献→技术壁垒）
                      </h3>
                      <div className="space-y-3">
                        {stock.orderList.map((order, i) => (
                          <div
                            key={i}
                            className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                  优先级 #{i + 1}
                                </span>
                                <span className="px-2 py-1 text-xs font-medium rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                  {order.status}
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                综合评分: {order.priorityScore.toFixed(1)}
                              </div>
                            </div>

                            <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                              {order.projectName}
                              {order.orderAmount && (
                                <span className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {order.orderAmount}
                                </span>
                              )}
                            </h4>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                              {order.customerName && (
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="w-4 h-4 text-slate-500" />
                                  <span className="text-muted-foreground">客户：</span>
                                  <span className="font-medium">{order.customerName}</span>
                                </div>
                              )}
                              {order.contractDate && (
                                <div className="flex items-center gap-2 text-sm">
                                  <CalendarIcon className="w-4 h-4 text-slate-500" />
                                  <span className="text-muted-foreground">合同日期：</span>
                                  <span className="font-medium">{order.contractDate}</span>
                                </div>
                              )}
                              {order.deliveryDate && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-slate-500" />
                                  <span className="text-muted-foreground">交付日期：</span>
                                  <span className="font-medium">{order.deliveryDate}</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2 mb-3">
                              {order.performanceContribution && (
                                <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                                  <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">业绩贡献</p>
                                  <p className="text-xs text-green-900 dark:text-green-100">{order.performanceContribution}</p>
                                </div>
                              )}
                              {order.technicalBarrier && (
                                <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded border border-purple-200 dark:border-purple-800">
                                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">技术壁垒</p>
                                  <p className="text-xs text-purple-900 dark:text-purple-100">{order.technicalBarrier}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-blue-600" />
                                  <span className="text-muted-foreground">确定性:</span>
                                  <span className="font-semibold">{order.orderCertainty}/10</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                <p className="text-muted-foreground">
                  {progressMessage || '正在分析股票数据，请稍候...'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
