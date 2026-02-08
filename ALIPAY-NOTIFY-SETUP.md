# 支付宝异步通知地址配置指南

## 什么是异步通知地址

异步通知地址是支付宝在用户支付成功后，自动通知你的服务器的URL。你的服务器接收到通知后，会验证签名并增加用户积分。

## 配置步骤

### 1. 登录支付宝开放平台

访问：https://open.alipay.com/
使用支付宝账号登录

### 2. 进入你的应用

1. 点击"开发者中心"
2. 选择"网页/移动应用"
3. 找到你创建的应用，点击进入

### 3. 配置异步通知地址

**方法一：在产品绑定中配置**

1. 在应用详情页，点击"产品绑定"
2. 找到"电脑网站支付"（alipay.trade.page.pay）
3. 点击"配置"
4. 找到"异步通知地址"配置项
5. 输入你的异步通知地址：
   - 开发环境：`http://localhost:5000/api/alipay/notify`
   - 生产环境：`https://your-domain.com/api/alipay/notify`
6. 点击"确定"保存

**方法二：在API设置中配置**

1. 在应用详情页，点击"开发信息"或"API设置"
2. 找到"异步通知地址"配置项
3. 输入你的异步通知地址
4. 点击"确定"保存

### 4. 配置要求

#### 地址格式

```
https://your-domain.com/api/alipay/notify
```

**重要要求**：
- ✅ 必须是完整的URL（包含协议）
- ✅ 生产环境必须使用 `https://` 协议
- ✅ 开发环境可以使用 `http://`（仅限测试）
- ✅ 地址必须可公网访问
- ❌ 不要使用内网IP地址（如192.168.x.x）
- ❌ 不要使用localhost（生产环境）

#### 路径说明

```
/api/alipay/notify
```

这是系统自动创建的接口，用于接收支付宝的异步通知。**不要修改这个路径**。

### 5. 测试配置

#### 开发环境测试（使用内网穿透）

如果你在本地开发，可以使用内网穿透工具让支付宝能够访问你的本地服务：

**使用 ngrok**（推荐）：
```bash
# 1. 下载并安装 ngrok
# 2. 运行 ngrok
ngrok http 5000

# 3. ngrok 会生成一个公网URL，例如：
# https://abc123.ngrok.io

# 4. 配置异步通知地址为：
# https://abc123.ngrok.io/api/alipay/notify
```

**使用其他内网穿透工具**：
- 花生壳
- frp
- Localtunnel

#### 生产环境配置

1. 确保你的服务器已部署
2. 配置HTTPS证书（Let's Encrypt免费证书）
3. 确保端口5000可公网访问
4. 配置异步通知地址为：`https://your-domain.com/api/alipay/notify`

### 6. 验证配置

#### 方法一：通过支付宝沙箱测试

1. 设置环境变量 `ALIPAY_SANDBOX=true`
2. 在沙箱环境中配置异步通知地址
3. 使用沙箱账号进行支付测试
4. 查看你的服务器日志，确认是否收到支付宝的通知

#### 方法二：手动测试

1. 启动你的服务
2. 使用 curl 测试接口是否可访问：

```bash
# 开发环境
curl -X POST http://localhost:5000/api/alipay/notify

# 生产环境
curl -X POST https://your-domain.com/api/alipay/notify
```

应该返回：
```json
{"message":"支付宝异步通知接口，请使用POST请求"}
```

### 7. 常见问题

#### Q1: 为什么支付宝没有发送异步通知？

可能原因：
- 异步通知地址配置错误
- 服务器无法访问（内网地址）
- HTTPS证书无效（生产环境）
- 防火墙阻止了支付宝的请求

#### Q2: 如何查看异步通知是否成功？

查看你的服务器日志：
```bash
tail -f /app/work/logs/bypass/app.log
```

搜索关键字：
```
grep "Alipay Notify" /app/work/logs/bypass/app.log
```

#### Q3: 异步通知地址和同步返回地址有什么区别？

- **异步通知地址**：支付宝服务器主动调用你的服务器，支付成功后自动通知（必须配置）
- **同步返回地址**：支付成功后，支付宝跳转到你指定的页面（可选配置）

本系统使用异步通知来增加积分，确保安全可靠。

#### Q4: 可以配置多个异步通知地址吗？

支付宝开放平台通常只允许配置一个异步通知地址。如果你有多个应用，可以在你的服务器端根据不同的参数分发请求。

### 8. 环境变量配置

确保你的 `.env.local` 文件中配置了正确的应用URL：

```bash
# 开发环境
NEXT_PUBLIC_APP_URL=http://localhost:5000

# 生产环境（使用ngrok）
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# 生产环境（正式部署）
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

这个URL会被系统用来构建完整的异步通知地址。

### 9. 安全建议

1. **使用HTTPS**：生产环境必须使用HTTPS，防止数据被篡改
2. **验证签名**：系统会自动验证所有异步通知的签名，不要禁用
3. **记录日志**：记录所有异步通知，便于排查问题
4. **限制访问**：虽然支付宝的签名已经足够安全，但可以考虑添加IP白名单

### 10. 配置示例

#### 开发环境配置示例

```bash
# .env.local
ALIPAY_APP_ID=2021001234567890
ALIPAY_PRIVATE_KEY=MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
ALIPAY_GATEWAY_URL=https://openapi.alipaydev.com/gateway.do
ALIPAY_SANDBOX=true
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

支付宝开放平台异步通知地址：
```
https://abc123.ngrok.io/api/alipay/notify
```

#### 生产环境配置示例

```bash
# .env.local
ALIPAY_APP_ID=2021001234567890
ALIPAY_PRIVATE_KEY=MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do
ALIPAY_SANDBOX=false
NEXT_PUBLIC_APP_URL=https://stock-analysis.example.com
```

支付宝开放平台异步通知地址：
```
https://stock-analysis.example.com/api/alipay/notify
```

## 技术说明

### 系统如何处理异步通知

1. 支付宝向你的服务器发送POST请求
2. 系统接收请求并验证签名
3. 检查订单状态和金额
4. 更新订单状态为completed
5. 增加用户积分
6. 返回success给支付宝

### 异步通知接口代码位置

文件：`src/app/api/alipay/notify/route.ts`

这个接口已经开发完成，你只需要配置正确的异步通知地址即可。

## 联系支持

如果配置过程中遇到问题：
1. 查看支付宝开放平台文档：https://opendocs.alipay.com/
2. 查看系统日志：`/app/work/logs/bypass/app.log`
3. 检查环境变量配置是否正确
4. 使用curl测试接口是否可访问
