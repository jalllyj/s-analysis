# 股票智能分析 - 收费版

一个基于 AI 的股票智能分析工具，支持 Excel 上传、多维度分析、热点概念追踪，现已升级为收费 SaaS 应用。

## 功能特性

### 核心功能
- 📊 **Excel 智能解析**：自动识别股票名称和代码列，支持多种格式
- 🤖 **AI 深度分析**：多维度搜索（11个维度），DeepSeek V3.2 模型
- 📈 **时间线分析**：短期（1-3月）、中期（3-6月）、大周期逻辑
- 📋 **订单追踪**：详细订单列表、确定性评分、优先级排序
- 🔥 **热点概念**：同花顺热点概念分析，实际关联识别
- 💰 **配额管理**：基于订阅的配额控制和使用记录

### 收费功能
- 👤 **用户认证**：JWT 登录/注册系统
- 💳 **套餐订阅**：免费版、基础版、专业版、企业版
- 📊 **使用监控**：实时查看配额使用情况
- 🔄 **自动扣费**：每次分析自动记录使用量

## 套餐定价

| 套餐 | 价格 | 月配额 | 特性 |
|------|------|--------|------|
| 免费版 | ¥0 | 5次 | 基础功能、社区支持 |
| 基础版 | ¥29/月 | 50次 | 完整功能、热点分析、邮件支持 |
| 专业版 | ¥99/月 | 500次 | API访问、优先支持、数据导出 |
| 企业版 | ¥299/月 | 无限 | 专属客户经理、定制化服务 |

## 技术栈

- **前端**：Next.js 16 + React 19 + TypeScript 5 + shadcn/ui + Tailwind CSS 4
- **后端**：Next.js API Routes + Drizzle ORM
- **数据库**：PostgreSQL
- **AI/搜索**：DeepSeek LLM + Web Search
- **存储**：S3 对象存储
- **认证**：JWT + bcryptjs

## 快速开始

### 1. 环境要求

- Node.js 18+
- PostgreSQL 数据库
- pnpm 包管理器

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/stock_analysis

# JWT密钥（生产环境请修改为强密码）
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars

# Stripe配置（支付功能，可选）
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# 对象存储配置
COZE_BUCKET_ENDPOINT_URL=
COZE_BUCKET_NAME=
```

### 4. 初始化数据库

```bash
pnpm tsx scripts/init-db.ts
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5000

## 项目结构

```
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # 认证API
│   │   │   ├── analyze/       # 分析API
│   │   │   ├── upload/        # 上传API
│   │   │   └── user/          # 用户API
│   │   ├── login/             # 登录页面
│   │   ├── register/          # 注册页面
│   │   ├── pricing/           # 定价页面
│   │   └── page.tsx           # 主页面
│   ├── components/ui/         # UI组件
│   ├── lib/
│   │   ├── auth.ts            # JWT认证
│   │   ├── db/
│   │   │   ├── schema.ts      # 数据库模型
│   │   │   └── index.ts       # 数据库连接
│   │   ├── pricing.ts         # 定价配置
│   │   └── quota.ts           # 配额管理
│   └── styles/
├── scripts/
│   └── init-db.ts             # 数据库初始化
├── .env.example               # 环境变量示例
└── README.md
```

## 数据库模型

### users
- id: 用户ID
- email: 邮箱（唯一）
- name: 姓名
- password: 密码（bcrypt加密）
- created_at: 创建时间
- updated_at: 更新时间

### subscriptions
- id: 订阅ID
- user_id: 用户ID
- plan_type: 套餐类型
- status: 状态
- start_date: 开始日期
- end_date: 结束日期
- monthly_quota: 月配额
- stripe_subscription_id: Stripe订阅ID
- stripe_customer_id: Stripe客户ID

### usage_records
- id: 记录ID
- user_id: 用户ID
- subscription_id: 订阅ID
- stocks_analyzed: 分析股票数量
- used_at: 使用时间

### payment_records
- id: 支付记录ID
- user_id: 用户ID
- subscription_id: 订阅ID
- amount: 金额
- currency: 货币
- stripe_payment_id: Stripe支付ID
- status: 状态

## API 接口

### 认证接口

#### POST /api/auth/register
注册新用户

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名"
}
```

#### POST /api/auth/login
用户登录

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 用户接口

#### GET /api/user/subscription
获取用户订阅信息

**请求头**:
```
Authorization: Bearer <token>
```

### 分析接口

#### POST /api/analyze
分析股票

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "fileKey": "s3-file-key"
}
```

**响应**: SSE 流式响应

## 使用说明

### 1. 注册账号
- 访问 `/register` 页面
- 填写邮箱、密码、姓名
- 系统自动创建免费版订阅

### 2. 上传分析文件
- 登录后访问首页
- 上传包含股票信息的 Excel 文件
- 系统自动识别股票名称和代码列
- 点击"开始分析"

### 3. 查看分析结果
- 实时显示分析进度
- 逐只显示股票分析结果
- 包含核心个股识别、催化时间线、订单列表、热点概念等

### 4. 升级套餐
- 访问 `/pricing` 页面
- 选择合适的套餐
- 支付功能即将上线

## 开发指南

### 添加新的定价套餐

编辑 `src/lib/pricing.ts`:

```typescript
export const PRICING_PLANS: PricingPlan[] = [
  // ... 现有套餐
  {
    id: 'new-plan',
    name: '新套餐',
    description: '套餐描述',
    monthlyQuota: 100,
    price: 59,
    currency: 'CNY',
    features: ['特性1', '特性2'],
    stripePriceId: 'price_xxx',
  },
];
```

### 修改配额检查逻辑

编辑 `src/lib/quota.ts`:

```typescript
export async function checkUserQuota(userId: number): Promise<QuotaCheckResult> {
  // 自定义检查逻辑
}
```

## 安全建议

1. **生产环境**：
   - 修改 JWT_SECRET 为强密码
   - 使用 HTTPS
   - 启用 CORS 限制
   - 定期备份数据库

2. **密码安全**：
   - 使用 bcryptjs 加密存储
   - 强制密码复杂度要求
   - 限制登录失败次数

3. **API 安全**：
   - 所有 API 需要认证
   - 限制请求频率
   - 验证输入参数

## 部署

### 使用 Coze CLI

```bash
# 构建
pnpm build

# 部署
coze deploy
```

### 手动部署

1. 构建 Next.js 应用
2. 配置 Nginx 反向代理
3. 设置环境变量
4. 启动服务

```bash
pnpm build
pnpm start
```

## 故障排除

### 数据库连接失败
- 检查 DATABASE_URL 配置
- 确认 PostgreSQL 服务运行
- 检查网络连接

### 认证失败
- 检查 JWT_SECRET 配置
- 确认 token 未过期
- 查看浏览器控制台错误

### 分析无响应
- 检查配额是否充足
- 查看后端日志
- 确认 AI 服务可用

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

如有问题，请联系 support@example.com
