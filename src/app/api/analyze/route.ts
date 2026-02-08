import { NextRequest } from 'next/server';
import { S3Storage, SearchClient, LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import * as XLSX from 'xlsx';

interface StockInfo {
  name: string;
  code: string;
}

interface CatalystEvent {
  timeRange: string; // "1-3个月" 或 "3-6个月" 或 "大周期"
  event: string;
  importance: number; // 1-10
  type: string; // "短线催化", "中线催化", "大周期逻辑", "政策催化", "业绩催化", "行业催化"
  certainty: number; // 1-10
  description: string;
}

interface OrderItem {
  projectName: string; // 项目名称
  orderAmount: string; // 订单金额
  customerName: string; // 客户名称
  contractDate: string; // 合同日期
  deliveryDate: string; // 交付日期
  orderCertainty: number; // 订单确定性 (1-10)
  performanceContribution: string; // 业绩贡献
  technicalBarrier: string; // 技术壁垒
  priorityScore: number; // 综合优先级评分（确定性×0.4 + 贡献×0.3 + 壁垒×0.3）
  status: string; // "执行中" | "待交付" | "已完成" | "待签约"
}

interface AnalysisResult {
  name: string;
  code: string;
  analysis: string;
  catalysts: string[];
  catalystTimeline: CatalystEvent[]; // 按时间线组织的催化事件
  shortTermCatalysts: string[]; // 1-3个月可炒作消息预期
  mediumTermCatalysts: string[]; // 3-6个月核心催化
  longTermLogic: string; // 大周期硬逻辑
  businessInfo: string;
  orderList: OrderItem[]; // 订单列表（按优先级排序）
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
                count: 10,
                timeRange: '1m',
              },
              {
                name: '订单详情',
                query: `${stock.name} ${stock.code} 订单金额 交付日期 订单进度 项目名称 客户名称`,
                count: 8,
                timeRange: '2m',
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
              {
                name: '未来催化（1-3个月）',
                query: `${stock.name} ${stock.code} 近期催化 2025年一季度 业绩预告 季报 产品价格 订单交付`,
                count: 8,
                timeRange: '2w',
              },
              {
                name: '中期催化（3-6个月）',
                query: `${stock.name} ${stock.code} 2025年中报 半年报 产能投产 新产品 行业趋势`,
                count: 6,
                timeRange: '3m',
              },
              {
                name: '大周期逻辑',
                query: `${stock.name} ${stock.code} 行业周期 景气周期 大宗商品 国际形势 宏观经济 贵金属 存储周期 供需周期`,
                count: 10,
                timeRange: '6m',
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
            const systemPrompt = `你是一位资深A股市场分析师，擅长识别核心个股、时间线分析和大周期逻辑判断，特别擅长订单分析和梳理。

核心个股判断标准：
1. 稀缺性：在产业链中具有独特地位或稀缺资源
2. 垄断性：在细分领域具有较高市场份额或技术壁垒
3. 竞争力：产品价格对业绩影响大，定价能力强
4. 成长性：订单确定，产能利用率高，业绩增长预期明确

催化时间线分析框架：
1. **1-3个月（短期催化）**：可炒作的消息预期，包括但不限于
   - 业绩预告/一季报发布时间点
   - 订单交付时间节点
   - 产品价格短期变化
   - 政策文件发布时间
   - 产能投产时间
   - 重要会议/展会时间

2. **3-6个月（中期催化）**：核心催化事件，包括但不限于
   - 半年报业绩预期
   - 产能爬坡/新产品放量
   - 行业需求旺季
   - 行业政策落地
   - 重大合同履行
   - 产能利用率提升

3. **大周期逻辑**：长期硬逻辑，包括但不限于
   - 行业景气周期（上行/下行/拐点）
   - 大宗商品价格周期（如存储涨价、贵金属、原油、有色金属等）
   - 国际形势变化（如地缘政治、贸易战、制裁等）
   - 宏观经济周期（通胀/通缩、利率周期、汇率变化）
   - 技术革命（如AI、新能源、半导体、新材料等）
   - 供需结构变化（产能出清、需求爆发、替代效应等）

大周期硬逻辑特征：
- 持续时间长（6个月以上甚至数年）
- 逻辑硬核，有基本面支撑
- 受宏观/国际/行业因素驱动
- 价格趋势明确（单边上涨或单边下跌）
- 对业绩影响深远

订单分析框架（重点）：
**订单确定性评分标准（1-10分）**：
- 9-10分：已签订合同，合同金额明确，客户信用良好，交付时间确定
- 7-8分：合同已签订但部分条款待确认，或订单意向明确
- 5-6分：订单谈判中，意向明确但未签约
- 3-4分：潜在订单，意向初步达成
- 1-2分：市场机会，无明确意向

**业绩贡献评估**：
- 量化分析订单对营收和利润的贡献
- 分析订单毛利率和利润率
- 评估订单对公司整体业绩的影响程度

**技术壁垒评估**：
- 订单所需技术的难度和稀缺性
- 公司是否拥有核心技术和专利
- 技术护城河和竞争壁垒

**订单优先级排序规则**：
优先级评分 = 订单确定性×0.4 + 业绩贡献×0.3 + 技术壁垒×0.3
按优先级评分从高到低排序

催化评分标准（1-10分）：
- 9-10分（极高催化）：核心个股 + 大周期上行 + 短中期催化密集 + 产品涨价 + 大额确定性订单
- 7-8分（高催化）：核心个股 + 中期催化确定 + 业绩超预期/政策利好 + 优质订单
- 5-6分（中等催化）：一般个股 + 短期催化 + 概念炒作 + 订单支撑
- 3-4分（低催化）：一般个股 + 市场热点 + 不确定性 + 订单不确定
- 1-2分（无催化）：无明确催化因素

请严格按照以下 JSON 格式返回分析结果：
{
  "analysis": "综合分析摘要（300字以内，包括时间线和大周期逻辑）",
  "catalysts": ["催化因素1（核心因素优先）", "催化因素2"],
  "catalystTimeline": [
    {
      "timeRange": "1-3个月",
      "event": "具体事件名称",
      "importance": 重要性评分(1-10),
      "type": "催化类型（短线催化/政策催化/业绩催化/行业催化）",
      "certainty": 确定性评分(1-10),
      "description": "详细描述和时间点"
    }
  ],
  "shortTermCatalysts": ["1-3个月可炒作预期1（具体时间点）", "1-3个月可炒作预期2"],
  "mediumTermCatalysts": ["3-6个月核心催化1（具体时间点）", "3-6个月核心催化2"],
  "longTermLogic": "大周期硬逻辑分析（行业周期、大宗商品、国际形势、宏观经济等）",
  "businessInfo": "业务信息：主营业务、核心产品、产能、市场份额、行业地位",
  "orderList": [
    {
      "projectName": "项目名称",
      "orderAmount": "订单金额（如：5亿元）",
      "customerName": "客户名称",
      "contractDate": "合同日期（如：2025年1月）",
      "deliveryDate": "交付日期（如：2025年6月）",
      "orderCertainty": 订单确定性评分(1-10),
      "performanceContribution": "业绩贡献描述（如：预计贡献营收5亿元，净利润8000万元）",
      "technicalBarrier": "技术壁垒描述（如：拥有独家专利技术，竞争壁垒高）",
      "priorityScore": 优先级评分(1-10, 自动计算),
      "status": "订单状态（执行中/待交付/已完成/待签约）"
    }
  ],
  "orderCertainty": 订单确定性评分(1-10整数),
  "performanceContribution": "业绩贡献：分析当前业务对业绩的潜在贡献，量化影响",
  "technicalBarriers": "技术壁垒：核心技术、专利、产能壁垒、成本优势、客户壁垒",
  "热点关联": "热点关联：与当前A股热点题材的关联性分析",
  "isCoreStock": true/false (是否为核心个股),
  "marketPosition": "市场地位：在行业中的位置和竞争力",
  "catalystScore": 催化概率评分(1-10整数)
}

分析要求：
1. **核心个股识别**：根据稀缺性、垄断性、竞争力、成长性判断
2. **时间线梳理**：按1-3个月、3-6个月、大周期三个维度梳理催化
3. **短期催化**：标注具体时间点（如"2025年3月发布一季报"）
4. **中期催化**：分析核心催化事件的确定性和影响
5. **大周期逻辑**：识别行业景气周期、大宗商品价格周期、国际形势等长期逻辑
6. **产品价格敏感度**：量化产品价格变动对业绩的影响
7. **订单确定性**：分析订单的可执行性和交付周期
8. **订单列表梳理**（重点）：
   - 明确列出所有订单项目
   - 每个订单包含：项目名称、订单金额、客户名称、合同日期、交付日期
   - 评估每个订单的确定性（1-10分）
   - 分析每个订单的业绩贡献（量化）
   - 分析每个订单的技术壁垒
   - 按优先级评分排序（确定性×0.4 + 贡献×0.3 + 壁垒×0.3）
9. **业绩贡献量化**：尽可能量化分析（如"预计提升毛利率X%"）
10. **技术壁垒评估**：分析核心竞争优势
11. **信息源标注**：所有分析必须基于搜索信息

特别提示：
- 重点标注1-3个月可炒作消息预期，包括具体时间点
- 大周期逻辑要明确说明驱动因素和持续时间
- 存储涨价、贵金属、有色金属、原油等大宗商品周期要重点分析
- 国际形势变化（如地缘政治、制裁）对相关公司的影响
- 行业景气周期要判断当前所处位置（上行/下行/拐点）
- **订单列表必须详细列出，包括具体金额和客户名称**
- **订单排序规则：确定性×0.4 + 业绩贡献×0.3 + 技术壁垒×0.3**
- 核心个股+大周期上行+密集催化+优质订单 = 极高催化（9-10分）`;

            const userPrompt = `股票信息：
名称：${stock.name}
代码：${stock.code}

【多维度搜索结果】
${searchContext}

请基于以上信息，进行深度分析，特别关注：
1. 是否为核心个股（稀缺性、垄断性、竞争力、成长性）
2. 时间线梳理：
   - 1-3个月可炒作消息预期（具体时间点）
   - 3-6个月核心催化事件
   - 大周期硬逻辑（行业周期、大宗商品、国际形势、宏观经济）
3. 产品价格变动对业绩的影响（量化）
4. **订单列表梳理**（重点）：
   - 明确列出所有订单项目
   - 订单金额、客户名称、合同日期、交付日期
   - 订单确定性、业绩贡献、技术壁垒评估
   - 按优先级排序
5. 订单确定性和交付周期
6. 行业供需格局和景气周期
7. 与当前市场热点的关联性
8. 综合评估催化概率和确定性

请详细梳理订单列表，按订单确定性→业绩贡献→技术壁垒的优先级排序。`;

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
                catalystTimeline: [],
                shortTermCatalysts: [],
                mediumTermCatalysts: [],
                longTermLogic: '数据解析失败',
                businessInfo: response.content,
                orderList: [],
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
