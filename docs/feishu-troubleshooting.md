# 飞书通知故障排查指南

## 问题诊断

### 1. 访问诊断页面
打开：`http://9.129.6.176:5000/test/feishu`

这个页面可以：
- 检查飞书配置
- 发送测试消息
- 查看详细的诊断信息

### 2. 检查飞书群组

#### 确认 Webhook URL
当前配置的 Webhook URL：
```
https://open.feishu.cn/open-apis/bot/v2/hook/0e1f2e46-0f44-4dff-ac55-c6ffb12ee77f
```

**如何确认 Webhook URL 对应的群组：**
1. 打开飞书开放平台
2. 进入"飞书开放平台" > "应用管理" > 你的应用
3. 找到"机器人"配置
4. 查看 Webhook URL 和对应的群组

### 3. 常见问题及解决方案

#### 问题 1：消息发送成功但收不到
**可能原因：**
- Webhook URL 对应的群组不是您所在的群组
- 机器人被设置为"仅管理员可见"
- 消息被发送到了历史消息中

**解决方案：**
- 在飞书中搜索群组名称
- 检查群组是否在"消息"列表中
- 确认机器人是否已被添加到群组

#### 问题 2：机器人被禁用
**可能原因：**
- 机器人被手动禁用
- 应用权限不足
- Webhook URL 已失效

**解决方案：**
1. 在飞书开放平台检查机器人状态
2. 重新启用机器人
3. 如果 Webhook URL 失效，重新生成一个新的

#### 问题 3：需要重新配置 Webhook
**如果 Webhook URL 已失效或需要更换群组：**

1. 在飞书开放平台创建新的机器人
2. 配置机器人到目标群组
3. 获取新的 Webhook URL
4. 更新 `.env.local` 文件中的 `FEISHU_WEBHOOK_URL`
5. 重启应用

### 4. 手动重发飞书通知

如果充值请求已创建但飞书通知未发送，可以使用重发功能：

#### 方法 1：使用 API
```bash
curl -X POST 'http://9.129.6.176:5000/api/user/topup/{requestId}/resend-notification' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer YOUR_TOKEN'
```

#### 方法 2：直接调用 Webhook
```bash
curl -X POST 'https://open.feishu.cn/open-apis/bot/v2/hook/0e1f2e46-0f44-4dff-ac55-c6ffb12ee77f' \
-H 'Content-Type: application/json' \
-d '{
  "msg_type": "text",
  "content": {
    "text": "测试消息：检查飞书通知是否正常"
  }
}'
```

### 5. 验证飞书机器人配置

#### 检查清单
- [ ] 机器人已创建并启用
- [ ] Webhook URL 正确配置
- [ ] 机器人已添加到目标群组
- [ ] 群组中机器人有发送消息权限
- [ ] 应用配置正确

### 6. 日志检查

#### 查看应用日志
```bash
tail -f /app/work/logs/bypass/dev.log
```

查找包含以下关键词的日志：
- "飞书"
- "feishu"
- "Webhook"

#### 预期日志输出
- 成功：`飞书 Webhook 消息发送成功`
- 失败：`发送飞书消息失败: [错误信息]`

### 7. 联系支持

如果以上方法都无法解决问题，请提供以下信息：
1. 飞书群组名称
2. 机器人配置截图
3. 应用日志（包含飞书相关部分）
4. 浏览器控制台错误信息

## 快速测试命令

### 测试 Webhook 连接
```bash
curl -X POST 'https://open.feishu.cn/open-apis/bot/v2/hook/0e1f2e46-0f44-4dff-ac55-c6ffb12ee77f' \
-H 'Content-Type: application/json' \
-d '{"msg_type":"text","content":{"text":"测试消息"}}'
```

### 测试应用 API
```bash
curl -X POST 'http://9.129.6.176:5000/api/test/feishu' \
-H 'Content-Type: application/json' \
-d '{}'
```

## 配置文件位置

### 环境变量
文件：`.env.local`
```env
FEISHU_APP_ID=cli_a90278570b38dcc7
FEISHU_APP_SECRET=SPcbpXPHXDNKlG1HGgSgFdrdl723PpUs
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/0e1f2e46-0f44-4dff-ac55-c6ffb12ee77f
```

### 修改配置后重启
```bash
pkill -f "coze dev"
coze dev > /app/work/logs/bypass/dev.log 2>&1 &
```
