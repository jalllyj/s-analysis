# 订单查询模式充值说明

## 充值流程（订单查询模式）

本系统使用**订单查询模式**进行充值确认，用户可以在支付完成后主动查询订单状态来确认充值。

### 充值步骤

#### 1. 选择充值档位
- 在定价页面选择充值档位（入门包 ¥5/10积分 或 经济包 ¥20/50积分）
- 点击"立即充值"按钮

#### 2. 创建订单
- 系统创建一个待支付订单（状态：pending）
- 自动跳转到订单确认页面

#### 3. 跳转支付宝支付
- 在订单确认页面，点击"跳转支付宝支付"按钮
- 系统生成支付宝支付链接并跳转
- 在支付宝完成支付

#### 4. 查询订单状态
- 支付成功后，返回订单确认页面
- 点击"查询订单状态"按钮
- 系统调用支付宝订单查询接口
- 确认支付成功后，自动增加积分

#### 5. 完成充值
- 积分自动增加到用户账户
- 显示支付成功提示
- 自动跳转回充值页面

### 新增API接口

#### 1. 查询本地订单
**接口**：`GET /api/orders/query?outTradeNo={订单号}`

**功能**：查询本地数据库中的订单状态

**响应**：
```json
{
  "success": true,
  "order": {
    "id": 1,
    "transactionId": "TOPUP_123_abc123...",
    "amount": 5,
    "credits": 10,
    "status": "completed",
    "paymentMethod": "alipay",
    "tradeNo": "2025020822001421231234567890",
    "description": "充值入门包（10积分）",
    "createdAt": "2024-02-08T12:00:00.000Z",
    "completedAt": "2024-02-08T12:05:00.000Z"
  }
}
```

#### 2. 确认订单（查询支付宝）
**接口**：`POST /api/orders/confirm`

**请求**：
```json
{
  "outTradeNo": "TOPUP_123_abc123..."
}
```

**功能**：
- 查询支付宝订单状态
- 验证支付状态和金额
- 如果支付成功，更新订单状态并增加积分

**响应（支付成功）**：
```json
{
  "success": true,
  "message": "支付成功，积分已增加",
  "order": {
    "transactionId": "TOPUP_123_abc123...",
    "status": "completed",
    "credits": 10,
    "tradeNo": "2025020822001421231234567890",
    "completedAt": "2024-02-08T12:05:00.000Z"
  }
}
```

**响应（未支付）**：
```json
{
  "success": false,
  "message": "订单未支付，请在支付宝完成支付",
  "alipayStatus": "pending"
}
```

**响应（订单不存在）**：
```json
{
  "success": false,
  "message": "订单不存在",
  "alipayStatus": "not_found"
}
```

#### 3. 创建充值订单
**接口**：`POST /api/user/topup`

**请求**：
```json
{
  "tierId": "credits_10"
}
```

**响应**：
```json
{
  "message": "订单创建成功",
  "paymentUrl": "https://openapi.alipay.com/gateway.do?...",
  "outTradeNo": "TOPUP_123_abc123...",
  "orderConfirmUrl": "/order-confirm/TOPUP_123_abc123...",
  "tier": {
    "id": "credits_10",
    "name": "入门包",
    "credits": 10,
    "price": 5
  }
}
```

### 订单确认页面

**路径**：`/order-confirm/[outTradeNo]`

**功能**：
- 显示订单信息（订单号、金额、积分、状态）
- 提供"跳转支付宝支付"按钮
- 提供"查询订单状态"按钮
- 自动轮询订单状态
- 支付成功后自动跳转

### 支付宝订单查询

系统使用支付宝订单查询接口（`alipay.trade.query`）来验证支付状态：

**查询接口**：`alipay.trade.query`

**支持的订单状态**：
- `WAIT_BUYER_PAY`：等待买家付款
- `TRADE_SUCCESS`：交易支付成功
- `TRADE_FINISHED`：交易结束，不可退款
- `TRADE_CLOSED`：未付款交易超时关闭

**支付成功的判断**：
```javascript
code === '10000' && (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED')
```

### 安全机制

1. **订单状态验证**：检查本地订单状态，避免重复处理
2. **金额验证**：验证支付宝订单金额与本地订单金额是否匹配
3. **签名验证**：支付宝返回的数据已经过签名验证
4. **用户身份验证**：只能查询和确认自己的订单

### 错误处理

#### 1. 订单不存在
```json
{
  "success": false,
  "message": "订单不存在"
}
```

#### 2. 金额不匹配
```json
{
  "success": false,
  "message": "金额不匹配"
}
```

#### 3. 查询支付宝失败
```json
{
  "success": false,
  "message": "查询支付宝订单失败"
}
```

### 与异步通知的区别

| 特性 | 异步通知 | 订单查询 |
|------|---------|---------|
| 触发方式 | 支付宝主动推送 | 用户主动查询 |
| 依赖性 | 需要配置异步通知地址 | 无需配置 |
| 实时性 | 自动、实时 | 用户点击后实时 |
| 可靠性 | 高（自动重试） | 中（需用户操作） |
| 用户体验 | 无感知 | 需要查询确认 |

### 优势

1. **无需配置异步通知地址**：不需要在支付宝开放平台配置异步通知地址
2. **用户主动控制**：用户可以随时查询订单状态
3. **透明度高**：用户可以看到订单状态变化
4. **易于调试**：可以手动查询订单状态进行测试

### 注意事项

1. **支付后务必查询**：支付成功后需要点击"查询订单状态"按钮才能增加积分
2. **订单有效期**：支付宝订单有一定有效期，超时未支付会自动关闭
3. **重复查询**：可以多次查询，系统会自动判断订单状态
4. **网络延迟**：支付成功后可能需要几秒钟才能查询到最新状态

### 测试建议

#### 开发环境测试
1. 使用沙箱环境测试
2. 创建订单后跳转支付宝
3. 完成支付
4. 返回确认页面查询订单状态
5. 验证积分是否正确增加

#### 生产环境测试
1. 小额测试（如最低档位）
2. 完整流程测试
3. 验证积分到账
4. 检查订单记录

### 常见问题

#### Q1: 支付成功后查询订单状态显示"未支付"？
**A**: 可能原因：
- 支付宝数据同步有延迟，等待几秒后重新查询
- 确认是否真的完成了支付
- 检查网络连接是否正常

#### Q2: 查询订单失败怎么办？
**A**:
- 检查网络连接
- 确认订单号是否正确
- 稍后重试

#### Q3: 可以不查询直接增加积分吗？
**A**: 不可以。为了安全，必须通过支付宝订单查询接口验证支付状态后才能增加积分。

#### Q4: 订单查询会扣费吗？
**A**: 不会。查询订单状态是免费的，不会产生额外费用。

### 配置要求

使用订单查询模式，**不需要**配置异步通知地址，只需要配置以下环境变量：

```bash
ALIPAY_APP_ID=your_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_alipay_public_key
ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do
ALIPAY_SANDBOX=false
```

### 技术实现

#### 支付宝订单查询工具
文件：`src/lib/alipay/query.ts`

功能：
- `queryAlipayOrder()` - 查询支付宝订单
- `isPaymentSuccess()` - 判断支付成功
- `isPaymentPending()` - 判断支付中
- `isOrderNotFound()` - 判断订单不存在

#### 订单确认页面
文件：`src/app/order-confirm/[outTradeNo]/page.tsx`

功能：
- 显示订单详情
- 跳转支付宝支付
- 查询订单状态
- 自动跳转充值页面

### 文件清单

新增文件：
- `src/lib/alipay/query.ts` - 支付宝订单查询工具
- `src/app/api/orders/query/route.ts` - 查询本地订单API
- `src/app/api/orders/confirm/route.ts` - 确认订单API
- `src/app/order-confirm/[outTradeNo]/page.tsx` - 订单确认页面

修改文件：
- `src/app/api/user/topup/route.ts` - 返回订单确认URL
- `src/app/pricing/page.tsx` - 跳转到订单确认页面
