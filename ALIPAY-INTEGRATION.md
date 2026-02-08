# 支付宝集成说明

## 概述

本系统已集成支付宝异步通知（Notify）机制，确保只有真实支付成功后才增加积分，防止恶意刷积分。

## 安全机制

1. **异步通知（Notify）**：支付宝支付成功后会自动调用 `/api/alipay/notify` 接口通知支付结果
2. **签名验证**：所有异步通知都经过RSA签名验证，防止伪造请求
3. **订单状态检查**：避免重复处理同一订单
4. **金额验证**：验证支付金额是否匹配

## 配置步骤

### 1. 申请支付宝开放平台账号

访问 [支付宝开放平台](https://open.alipay.com/)，注册账号并创建应用。

### 2. 生成密钥

1. 下载支付宝密钥生成工具：[https://opendocs.alipay.com/common/02kipl](https://opendocs.alipay.com/common/02kipl)
2. 生成应用私钥和应用公钥
3. 将应用公钥上传到支付宝开放平台
4. 从支付宝获取支付宝公钥

**重要**：使用PKCS#1格式的私钥，不是PKCS#8格式。

### 3. 配置环境变量

复制 `.env.alipay.example` 为 `.env.local`，并填入你的支付宝配置：

```bash
# 支付宝应用ID
ALIPAY_APP_ID=2021001234567890

# 支付宝应用私钥（注意：使用PKCS#1格式的私钥）
ALIPAY_PRIVATE_KEY=MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...

# 支付宝公钥（从支付宝开放平台获取）
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...

# 支付宝网关地址（正式环境）
ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do

# 是否使用沙箱环境（测试时设为true，正式环境设为false）
ALIPAY_SANDBOX=false

# 应用URL（用于异步通知回调，部署到线上后修改）
NEXT_PUBLIC_APP_URL=http://localhost:5000
```

### 4. 配置异步通知地址

在支付宝开放平台配置异步通知地址：
- 异步通知地址：`https://your-domain.com/api/alipay/notify`

注意：
- 开发环境使用 `http://localhost:5000/api/alipay/notify`
- 生产环境必须使用 HTTPS 地址

### 5. 测试支付

1. 先在沙箱环境测试（设置 `ALIPAY_SANDBOX=true`）
2. 登录支付宝沙箱账号进行测试
3. 确认支付成功后积分是否正确增加
4. 确认异步通知是否正常触发

## 支付流程

### 用户侧

1. 用户在充值页面选择档位
2. 点击"立即充值"按钮
3. 跳转到支付宝支付页面
4. 完成支付
5. 支付宝自动回调通知接口
6. 用户积分自动增加

### 系统侧

1. 用户点击充值 → 创建订单（状态：pending）
2. 生成支付宝支付URL并跳转
3. 用户完成支付
4. 支付宝调用 `/api/alipay/notify` 接口
5. 验证签名和订单信息
6. 更新订单状态为completed
7. 增加用户积分

## API接口

### 1. 创建充值订单

**接口**：`POST /api/user/topup`

**请求体**：
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
  "outTradeNo": "TOPUP_123456_abc123...",
  "tier": {
    "id": "credits_10",
    "name": "入门包",
    "credits": 10,
    "price": 5
  }
}
```

### 2. 支付宝异步通知

**接口**：`POST /api/alipay/notify`

**参数**（支付宝POST表单）：
- `trade_status`: 交易状态（TRADE_SUCCESS/TRADE_FINISHED）
- `out_trade_no`: 商户订单号
- `trade_no`: 支付宝交易号
- `total_amount`: 支付金额
- `sign`: 签名

**响应**：
```json
{
  "success": true
}
```

## 注意事项

### 安全性

1. **严格验证签名**：所有异步通知必须验证签名
2. **订单状态检查**：避免重复处理
3. **金额验证**：确保支付金额匹配
4. **HTTPS**：生产环境必须使用HTTPS

### 事务处理

1. 如果异步通知接口返回失败，支付宝会多次重试（最多7次）
2. 订单状态更新和积分增加应该在一个事务中完成
3. 记录所有交易日志便于排查问题

### 沙箱测试

1. 沙箱环境用于测试，不会产生真实交易
2. 沙箱账号和密码在支付宝开放平台获取
3. 切换到生产环境前必须先在沙箱测试通过

## 常见问题

### Q1: 支付成功后积分没有增加？

**排查步骤**：
1. 检查异步通知地址是否正确配置
2. 检查服务器日志查看异步通知是否收到
3. 检查签名是否验证通过
4. 检查订单状态是否已更新

### Q2: 如何查看订单状态？

可以在数据库中查询 `creditTransactions` 表：
- `status`: pending/completed
- `transactionId`: 商户订单号
- `tradeNo`: 支付宝交易号

### Q3: 支付宝回调地址是什么？

开发环境：`http://localhost:5000/api/alipay/notify`
生产环境：`https://your-domain.com/api/alipay/notify`

### Q4: 如何生成RSA密钥？

使用支付宝提供的密钥生成工具：
- 下载地址：https://opendocs.alipay.com/common/02kipl
- 选择2048位密钥
- 选择PKCS#1格式
- 保存应用私钥和公钥

## 参考资料

- [支付宝开放平台文档](https://opendocs.alipay.com/)
- [电脑网站支付](https://opendocs.alipay.com/open/270)
- [异步通知](https://opendocs.alipay.com/open/203/105286)
- [签名机制](https://opendocs.alipay.com/open/291/106103)
