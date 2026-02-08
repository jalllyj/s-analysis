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
  isCoreStock: boolean;
  marketPosition: string;
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

        // 提取股票信息
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
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: `正在分析 ${stock.name}(${stock.code})...` })}\n\n`)
            );

            // 多维度搜索策略
            const searchQueries = [
              {
                name: '公司基本信息',
                query: `${stock.name} ${stock.code} 主营业务 核心产品 产能 市场份额 行业地位`,
                count: 8,
                timeRange: '3m',
              },
              {
                name: '价格和业绩',
                query: `${stock.name} ${stock.code} 产品价格 涨价 价格变动 财报 业绩 2024 2025`,
                count: 8,
                timeRange: '1m',
              },
              {
                name: '订单和客户',
                query: `${stock.name} ${stock.code} 订单 签约 客户 重大项目 合同 中标`,
                count: 6,
                timeRange: '1m',
              },
              {
                name: '政策和行业',
                query: `${stock.name} ${stock.code} 政策 行业政策 产业政策 支持政策 2024 2025`,
                count: 6,
                timeRange: '2m',
              },
              {
                name: '热点题材',
                query: `${stock.name} ${stock.code} 热点题材 概念板块 炒作预期 市场热点 A股 2025`,
                count: 8,
                timeRange: '2w',
              },
              {
                name: '竞品和供需',
                query: `${stock.name} ${stock.code} 供需 产能利用率 行业供需 竞争对手 市场格局`,
                count: 6,
                timeRange: '1m',
              },
            ];

            const allSearchResults: any[] = [];
            const allSources: string[] = [];

            // 执行多维度搜索
            for (const search of searchQueries) {
              try {
                const results = await searchClient.advancedSearch(search.query, {
                  count: search.count,
                  timeRange: search.timeRange,
                  needSummary: true,
                });

                if (results.web_items && results.web_items.length > 0) {
                  allSearchResults.push({
                    category: search.name,
                    items: results.web_items,
                  });

                  results.web_items.forEach((item: any) => {
                    if (item.url && !allSources.includes(item.url)) {
                      allSources.push(item.url);
                    }
                  });
                }
              } catch (searchError) {
                console.error(`搜索 ${search.name} 失败:`, searchError);
              }
            }

            // 整合所有搜索结果
            const searchContext = allSearchResults.map(category => {
              const items = category.items.map((item: any) =>
                `[${item.publish_time || '未知'}] ${item.title}\n摘要: ${item.snippet}`
              ).join('\n\n');
              return `【${category.category}】\n${items}`;
            }).join('\n\n---\n\n');

            // 改进的系统提示
            const systemPrompt = `你是一位资深A股市场分析师，擅长识别核心个股和催化因素。

核心个股判断标准：
1. 稀缺性：在产业链中具有独特地位或稀缺资源
2. 垄断性：在细分领域具有较高市场份额或技术壁垒
3. 竞争力：产品价格对业绩影响大，定价能力强
4. 成长性：订单确定，产能利用率高，业绩增长预期明确

催化评分标准（1-10分）：
- 9-10分（极高催化）：核心个股+产品涨价/重大订单+行业景气度高
- 7-8分（高催化）：核心个股+业绩超预期/政策利好+订单确定
- 5-6分（中等催化）：一般个股+概念炒作+政策支持
- 3-4分（低催化）：一般个股+市场热点+不确定性
- 1-2分（无催化）：无明确催化因素

请严格按照以下 JSON 格式返回分析结果：
{
  "analysis": "综合分析摘要（300字以内）",
  "catalysts": ["催化因素1（核心因素优先）", "催化因素2"],
  "expectedNews": ["可炒作预期1（具体时间点和事件）", "可炒作预期2"],
  "businessInfo": "业务信息：主营业务、核心产品、产能、市场份额、行业地位",
  "orderCertainty": 订单确定性评分(1-10整数),
  "performanceContribution": "业绩贡献：分析当前业务对业绩的潜在贡献，量化影响",
  "technicalBarriers": "技术壁垒：核心技术、专利、产能壁垒、成本优势、客户壁垒",
  "热点关联": "热点关联：与当前A股热点题材的关联性分析",
  "isCoreStock": true/false (是否为核心个股),
  "marketPosition": "市场地位：在行业中的位置和竞争力",
  "catalystScore": 催化概率评分(1-10整数)
}

分析要求：
1. **核心个股识别**：根据稀缺性、垄断性、竞争力、成长性判断是否为核心个股
2. **产品价格敏感度**：重点关注产品价格变动，如PVC涨价对新疆天业的影响
3. **订单确定性**：分析订单的可执行性、客户质量、合同金额和交付周期
4. **业绩贡献量化**：尽可能量化分析对业绩的影响（如"预计提升毛利率X%"）
5. **技术壁垒评估**：分析核心竞争优势（如专利、产能、成本、渠道等）
6. **热点关联性**：分析与当前市场热点（如AI、新能源、新材料等）的关联
7. **信息源标注**：所有分析必须基于搜索到的信息，不得编造
8. **催化排序**：催化因素按重要性和确定性排序，核心因素放首位

特别提示：
- 产品涨价是核心催化，要量化涨价对业绩的影响
- 核心个股的催化概率应给予更高评分
- 订单确定性要考虑行业周期和客户需求稳定性`;

            const userPrompt = `股票信息：
名称：${stock.name}
代码：${stock.code}

【多维度搜索结果】
${searchContext}

请基于以上信息，进行深度分析，特别关注：
1. 是否为核心个股（稀缺性、垄断性、竞争力、成长性）
2. 产品价格变动对业绩的影响（如PVC涨价、硅料降价等）
3. 订单确定性和产能利用率
4. 行业供需格局和竞争态势
5. 与当前热点题材的关联性
6. 综合评估催化概率和确定性`;

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
              const jsonMatch = response.content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                analysisData = JSON.parse(jsonMatch[0]);
              } else {
                throw new Error('未找到有效的 JSON 格式');
              }
            } catch (e) {
              analysisData = {
                name: stock.name,
                code: stock.code,
                analysis: response.content.substring(0, 500),
                catalysts: ['数据解析失败，请查看完整分析'],
                expectedNews: [],
                businessInfo: response.content,
                orderCertainty: 5,
                performanceContribution: '数据解析失败',
                technicalBarriers: '数据解析失败',
                热点关联: '数据解析失败',
                sources: allSources,
                catalystScore: 5,
                isCoreStock: false,
                marketPosition: '数据解析失败',
              };
            }

            // 补充股票信息
            analysisData.name = stock.name;
            analysisData.code = stock.code;
            analysisData.sources = allSources;

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
