import { NextRequest } from 'next/server';
import { S3Storage, SearchClient, LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import * as XLSX from 'xlsx';

interface StockInfo {
  name: string;
  code: string;
}

interface AnalysisResult {
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

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { fileKey } = await request.json();
        const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

        if (!fileKey) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '未提供文件密钥' })}\n\n`)
          );
          controller.close();
          return;
        }

        // 初始化对象存储
        const storage = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: '',
          secretKey: '',
          bucketName: process.env.COZE_BUCKET_NAME,
          region: 'cn-beijing',
        });

        // 下载文件
        const fileBuffer = await storage.readFile({ fileKey });

        // 解析 Excel
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // 提取股票信息（假设第一列是名称，第二列是代码）
        const stocks: StockInfo[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row[0] && row[1]) {
            stocks.push({
              name: String(row[0]),
              code: String(row[1]),
            });
          }
        }

        if (stocks.length === 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '未找到有效的股票数据' })}\n\n`)
          );
          controller.close();
          return;
        }

        // 初始化搜索和 LLM 客户端
        const searchConfig = new Config();
        const searchClient = new SearchClient(searchConfig, customHeaders);

        const llmConfig = new Config();
        const llmClient = new LLMClient(llmConfig);

        // 分析每只股票
        for (const stock of stocks) {
          try {
            // 搜索最新消息
            const searchQuery = `${stock.name} ${stock.code} 最新消息 2024 2025 财报 业务 订单 催化`;
            const searchResults = await searchClient.advancedSearch(searchQuery, {
              count: 10,
              timeRange: '1m',
              needSummary: true,
            });

            // 搜索热点题材
            const hotTopicQuery = `${stock.name} ${stock.code} 热点题材 炒作预期 概念板块 A股 2024 2025`;
            const hotTopicResults = await searchClient.advancedSearch(hotTopicQuery, {
              count: 5,
              timeRange: '2w',
              needSummary: true,
            });

            // 收集信息源
            const sources: string[] = [];
            searchResults.web_items?.forEach(item => {
              if (item.url) sources.push(item.url);
            });
            hotTopicResults.web_items?.forEach(item => {
              if (item.url && !sources.includes(item.url)) sources.push(item.url);
            });

            // 准备分析上下文
            const searchContext = searchResults.web_items?.map(item =>
              `标题: ${item.title}\n摘要: ${item.snippet}\n发布时间: ${item.publish_time || '未知'}`
            ).join('\n\n') || '未找到相关消息';

            const hotTopicContext = hotTopicResults.web_items?.map(item =>
              `标题: ${item.title}\n摘要: ${item.snippet}`
            ).join('\n\n') || '未找到热点题材信息';

            const systemPrompt = `你是一位专业的股票分析师。请根据搜索到的信息，对股票进行深度分析。

请严格按照以下 JSON 格式返回分析结果，不要添加任何其他文字：
{
  "analysis": "综合分析摘要",
  "catalysts": ["催化因素1", "催化因素2"],
  "expectedNews": ["可炒作预期1", "可炒作预期2"],
  "businessInfo": "业务信息描述",
  "orderCertainty": 订单确定性评分(1-10整数),
  "performanceContribution": "业绩贡献分析",
  "technicalBarriers": "技术壁垒分析",
  "热点关联": "热点事件与题材关联性分析",
  "catalystScore": 催化概率评分(1-10整数)
}

评分标准：
- 订单确定性：1-3分(低)，4-6分(中)，7-8分(高)，9-10分(极高)
- 催化概率：1-3分(无催化)，4-5分(低催化)，6-7分(中等催化)，8-10分(高催化)

分析要求：
1. 消息催化：提取最近的利好消息和潜在催化因素
2. 可炒作预期：分析市场可能炒作的预期和题材
3. 业务信息：分析公司的主营业务和核心竞争力
4. 订单确定性：评估订单的确定性和可持续性
5. 业绩贡献：分析业务对业绩的潜在贡献
6. 技术壁垒：评估公司的技术护城河和竞争优势
7. 热点关联：分析公司与当前热点事件的关联性
8. 催化概率：综合评估催化发生的概率`;

            const userPrompt = `股票信息：
名称：${stock.name}
代码：${stock.code}

搜索到的最新消息：
${searchContext}

搜索到的热点题材信息：
${hotTopicContext}

请根据以上信息，对该股票进行全面分析。`;

            const messages = [
              { role: 'system' as const, content: systemPrompt },
              { role: 'user' as const, content: userPrompt },
            ];

            const response = await llmClient.invoke(messages, {
              model: 'deepseek-v3-2-251201',
              temperature: 0.7,
            });

            // 解析 JSON 响应
            let analysisData: AnalysisResult;
            try {
              // 尝试提取 JSON
              const jsonMatch = response.content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                analysisData = JSON.parse(jsonMatch[0]);
              } else {
                throw new Error('未找到有效的 JSON 格式');
              }
            } catch (e) {
              // 如果解析失败，创建默认结构
              analysisData = {
                name: stock.name,
                code: stock.code,
                analysis: response.content,
                catalysts: ['数据解析失败，请查看完整分析'],
                expectedNews: [],
                businessInfo: response.content,
                orderCertainty: 5,
                performanceContribution: '数据解析失败',
                technicalBarriers: '数据解析失败',
                热点关联: '数据解析失败',
                sources,
                catalystScore: 5,
              };
            }

            // 添加股票信息
            analysisData.name = stock.name;
            analysisData.code = stock.code;
            analysisData.sources = sources;

            // 发送结果
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'result', data: analysisData })}\n\n`)
            );
          } catch (stockError) {
            console.error(`分析股票 ${stock.name} 失败:`, stockError);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                message: `分析股票 ${stock.name} 失败: ${stockError instanceof Error ? stockError.message : '未知错误'}`
              })}\n\n`)
            );
          }
        }

        // 发送完成信号
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error('Analysis error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: '分析过程中发生错误' })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
