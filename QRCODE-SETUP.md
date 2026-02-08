# 收款码配置指南

## 概述

系统支持扫码充值方式，用户可以扫描微信或支付宝收款码进行支付，然后上传支付凭证，管理员审核后增加积分。

## 配置步骤

### 1. 准备收款码图片

你需要准备一张收款码图片，可以是：
- 微信个人收款码
- 支付宝个人收款码
- 企业收款码

### 2. 添加收款码图片

将收款码图片命名为 `qrcode.jpg`，放置在项目的 `public/` 目录下：

```
workspace/projects/
├── public/
│   └── qrcode.jpg  ← 放在这里
├── src/
└── ...
```

### 3. 验证收款码

访问定价页面：`http://localhost:5000/pricing`

点击"扫码充值"按钮，应该能看到你上传的收款码。

## 充值流程

### 用户端

1. 用户登录系统
2. 进入定价页面，选择充值档位
3. 点击"扫码充值"按钮
4. 使用微信或支付宝扫描收款码
5. 支付成功后，截图保存支付凭证
6. 上传支付凭证图片
7. 提交审核
8. 等待管理员审核通过后，积分自动增加

### 管理员端

管理员需要审核用户的充值订单：

1. 查看待审核订单（可通过数据库查询）
2. 验证支付凭证
3. 确认支付金额正确
4. 手动增加用户积分（使用管理员接口）

## 管理员充值接口

### 接口地址

`POST /api/admin/add-credits-by-email`

### 请求参数

```json
{
  "email": "user@example.com",
  "credits": 10,
  "description": "审核通过：充值10积分"
}
```

### 响应

```json
{
  "message": "充值成功",
  "userId": 1,
  "email": "user@example.com",
  "creditsAdded": 10,
  "newBalance": 10
}
```

### 使用示例

```bash
curl -X POST http://localhost:5000/api/admin/add-credits-by-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "credits": 10,
    "description": "审核通过：充值10积分"
  }'
```

## 查看待审核订单

### 查询SQL

```sql
-- 查看待审核的扫码充值订单
SELECT
  ct.id,
  ct.transaction_id,
  u.email,
  ct.amount,
  ct.credits,
  ct.description,
  ct.status,
  ct.created_at
FROM credit_transactions ct
JOIN users u ON ct.user_id = u.id
WHERE ct.payment_method = 'qrcode'
  AND ct.status = 'pending'
ORDER BY ct.created_at DESC;
```

### 审核通过流程

1. 查询待审核订单（使用上面的SQL）
2. 查看用户上传的支付凭证（存储在对象存储中）
3. 验证支付凭证是否真实有效
4. 确认支付金额和充值金额一致
5. 使用管理员充值接口增加积分
6. 更新订单状态为 `completed`

## 注意事项

1. **收款码安全**：收款码图片会公开显示在定价页面，确保收款码安全
2. **审核时效**：建议在1-2小时内完成审核，提升用户体验
3. **支付验证**：仔细核对支付凭证，防止虚假充值
4. **订单状态**：及时更新订单状态，避免重复处理
5. **支付金额**：确保用户支付的金额与充值档位金额一致

## 其他充值方式

### 1. 管理员直接充值

如果需要直接给用户充值（不经过支付），可以使用管理员接口：

```bash
curl -X POST http://localhost:5000/api/admin/add-credits-by-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "credits": 50,
    "description": "管理员手动赠送"
  }'
```

### 2. 支付宝在线支付（需要配置）

如果需要使用支付宝在线支付，需要配置环境变量：
- ALIPAY_APP_ID
- ALIPAY_PRIVATE_KEY
- ALIPAY_PUBLIC_KEY

详见 `ALIPAY-INTEGRATION.md` 文档。

## 常见问题

### Q1: 收款码图片不显示？

检查 `public/qrcode.jpg` 文件是否存在：
```bash
ls -la /workspace/projects/public/qrcode.jpg
```

如果不存在，请添加收款码图片到该位置。

### Q2: 如何查看用户上传的支付凭证？

支付凭证存储在对象存储中，可以通过 `receiptFileKey` 字段找到文件。

### Q3: 积分没有增加？

检查以下几点：
1. 是否使用了管理员充值接口
2. 用户邮箱是否正确
3. 数据库操作是否成功
4. 查看服务器日志

### Q4: 如何防止重复充值？

系统会检查订单状态，只有 `pending` 状态的订单才会被审核。审核后状态变为 `completed`，不会重复处理。

## 技术支持

如遇到问题，请查看：
1. 服务器日志：`/app/work/logs/bypass/app.log`
2. 数据库订单状态
3. 对象存储中的支付凭证文件

## 安全建议

1. **收款码管理**：定期更换收款码，避免长期使用同一个
2. **审核严格**：严格审核每笔充值，防止虚假充值
3. **日志记录**：记录所有充值操作，便于追溯
4. **权限控制**：管理员接口应该限制访问权限
