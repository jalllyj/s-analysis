'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { 
  TrendingUp, FileText, Coins, Clock, RefreshCw, Activity, 
  DollarSign, Zap 
} from 'lucide-react';

interface OverviewData {
  totalAnalyses: number;
  totalStocks: number;
  totalTokens: number;
  avgDuration: number;
}

interface DailyStat {
  date: string;
  analyses: number;
  stocks: number;
  tokens: number;
}

interface RecentAnalysis {
  id: number;
  fileName: string;
  stockCount: number;
  totalSearchCount: number;
  totalTokens: number;
  analysisDuration: number;
  createdAt: string;
}

interface StatsData {
  overview: OverviewData;
  dailyStats: DailyStat[];
  recentAnalyses: RecentAnalysis[];
  tokenTrend: DailyStat[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stats?days=${days}`);
      if (!response.ok) throw new Error('获取统计数据失败');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [days]);

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">加载统计数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            数据统计面板
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            查看分析使用数据和积分消耗情况
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              onClick={() => setDays(d)}
              className="min-w-[80px]"
            >
              {d}天
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={fetchStats}
            className="ml-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                总分析次数
              </CardTitle>
              <FileText className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.overview.totalAnalyses}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                累计完成分析
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                分析股票数
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.overview.totalStocks}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                累计分析股票
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                积分消耗
              </CardTitle>
              <Coins className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {(stats.overview.totalTokens / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Token消耗量
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                平均耗时
              </CardTitle>
              <Clock className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.overview.avgDuration}s
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                每次分析平均时长
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Analysis Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>分析趋势</CardTitle>
              <CardDescription>
                最近{days}天的分析次数和股票数量
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="analyses" fill="#3b82f6" name="分析次数" />
                  <Bar dataKey="stocks" fill="#22c55e" name="股票数量" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Token Consumption Chart */}
          <Card>
            <CardHeader>
              <CardTitle>积分消耗趋势</CardTitle>
              <CardDescription>
                最近{days}天的Token消耗量
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.tokenTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()}`, 'Tokens']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="tokens" 
                    stroke="#eab308" 
                    strokeWidth={2}
                    name="Token消耗"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Analyses */}
        <Card>
          <CardHeader>
            <CardTitle>最近分析记录</CardTitle>
            <CardDescription>
              最新的10次分析记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      文件名
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      股票数
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      搜索次数
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      Token消耗
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      耗时
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      时间
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAnalyses.map((analysis) => (
                    <tr 
                      key={analysis.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">
                        {analysis.fileName}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          {analysis.stockCount}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4 text-blue-500" />
                          {analysis.totalSearchCount}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          {analysis.totalTokens.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-purple-500" />
                          {analysis.analysisDuration}s
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(analysis.createdAt).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            返回分析页面
          </Button>
        </div>
      </div>
    </div>
  );
}
