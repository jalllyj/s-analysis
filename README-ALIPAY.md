# 股票智能分析系统 - 支付宝集成说明

## 支付安全升级完成

本系统已成功集成支付宝异步通知（Notify）机制，确保只有真实支付成功后才增加积分，有效防止恶意刷积分。

## 安全机制

### 1. 异步通知（Notify）验证
- 支付宝支付成功后会自动调用 `/api/alipay/notify` 接口通知支付结果
- 所有通知都经过RSA签名验证，防止伪造请求
- 订单状态检查，避免重复处理同一订单
- 金额验证，确保支付金额匹配

### 2. 支付流程
1. 用户选择充值档位 → 创建订单（状态：pending）
2. 生成支付宝支付URL并跳转到支付宝
3. 用户完成支付
4. 支付宝异步通知系统接口 `/api/alipay/notify`
5. 验证签名、订单号、金额等信息
6. 更新订单状态为completed并增加用户积分

## 配置步骤

### 前置条件
- 需要支付宝开放平台账号
- 需要创建应用并获取相关配置

### 1. 环境变量配置

复制 `.env.alipay.example` 为 `.env.local` 并填入你的配置：

```bash
# 支付宝应用ID
ALIPAY_APP_ID=your_app_id_here

# 支付宝应用私钥（注意：使用PKCS#1格式的私钥）
ALIPAY_PRIVATE_KEY=your_private_key_here

# 支付宝公钥（从支付宝开放平台获取）
ALIPAY_PUBLIC_KEY=your_alipay_public_key_here

# 支付宝网关地址
# 正式环境：https://openapi.alipay.com/gateway.do
# 沙箱环境：https://openapi.alipaydev.com/gateway.do
ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do

# 是否使用沙箱环境（true/false）
ALIPAY_SANDBOX=false

# 应用URL（用于异步通知回调）
NEXT_PUBLIC_APP_URL=http://localhost:5000
```

### 2. 支付宝开放平台配置

在支付宝开放平台配置：
- **异步通知地址**：`https://your-domain.com/api/alipay/notify`
- 开发环境使用：`http://localhost:5000/api/alipay/notify`
- 生产环境必须使用HTTPS地址

### 3. 生成密钥

1. 下载支付宝密钥生成工具：https://opendocs.alipay.com/common/02kipl
2. 生成应用私钥和应用公钥
3. 将应用公钥上传到支付宝开放平台
4. 从支付宝获取支付宝公钥

**重要**：使用PKCS#1格式的私钥，不是PKCS#8格式。

### 4. 测试支付

1. 先在沙箱环境测试（设置 `ALIPAY_SANDBOX=true`）
2. 登录支付宝沙箱账号进行测试
3. 确认支付成功后积分是否正确增加
4. 确认异步通知是否正常触发

## 数据库迁移

系统已自动完成数据库迁移，为 `credit_transactions` 表添加了以下字段：

- `transaction_id`: 商户订单号
- `credits`: 积分数量
- `status`: 订单状态（pending/completed/failed）
- `payment_method`: 支付方式（alipay等）
- `trade_no`: 支付宝交易号
- `buyer_id`: 买家ID
- `completed_at`: 完成时间
- `updated_at`: 更新时间

## API接口

### 创建充值订单
- **接口**: `POST /api/user/topup`
- **参数**: `{ "tierId": "credits_10" }`
- **响应**: 返回支付宝支付URL

### 支付宝异步通知
- **接口**: `POST /api/alipay/notify`
- **触发**: 支付宝自动调用
- **验证**: RSA签名、订单号、金额等

## 充值流程变更

### 之前（不安全）
- 用户点击充值 → 直接增加积分（无支付验证）

### 现在（安全）
- 用户点击充值 → 跳转支付宝支付 → 支付成功 → 异步通知验证 → 增加积分

## 测试建议

### 开发环境测试
1. 设置 `ALIPAY_SANDBOX=true` 使用沙箱环境
2. 使用沙箱账号进行测试
3. 检查异步通知是否正常触发
4. 验证积分是否正确增加

### 生产环境部署
1. 设置 `ALIPAY_SANDBOX=false`
2. 配置正确的 `NEXT_PUBLIC_APP_URL`（HTTPS）
3. 在支付宝开放平台配置异步通知地址
4. 进行小额测试确保一切正常

## 文件清单

新增/修改的文件：

1. `src/lib/alipay/config.ts` - 支付宝配置
2. `src/lib/alipay/utils.ts` - 支付宝工具函数（签名、验签）
3. `src/app/api/alipay/notify/route.ts` - 异步通知接口
4. `src/app/api/user/topup/route.ts` - 充值接口（修改）
5. `src/app/pricing/page.tsx` - 充值页面（修改）
6. `src/lib/db/schema.ts` - 数据库Schema（添加字段）
7. `.env.alipay.example` - 环境变量模板
8. `ALIPAY-INTEGRATION.md` - 详细集成文档

## 注意事项

1. **签名验证必须严格**：所有异步通知必须验证签名
2. **订单状态检查**：避免重复处理同一订单
3. **金额验证**：确保支付金额匹配
4. **HTTPS要求**：生产环境必须使用HTTPS
5. **事务处理**：订单状态和积分更新应该在一个事务中完成
6. **日志记录**：记录所有交易日志便于排查问题

## 故障排查

### 支付成功但积分未增加
1. 检查异步通知地址是否正确配置
2. 查看服务器日志确认异步通知是否收到
3. 检查签名是否验证通过
4. 检查订单状态是否已更新

### 查看订单状态
在数据库查询 `credit_transactions` 表：
- `status`: pending/completed
- `transactionId`: 商户订单号
- `tradeNo`: 支付宝交易号

## 参考资料

- [支付宝开放平台文档](https://opendocs.alipay.com/)
- [电脑网站支付](https://opendocs.alipay.com/open/270)
- [异步通知](https://opendocs.alipay.com/open/203/105286)
- [签名机制](https://opendocs.alipay.com/open/291/106103)
