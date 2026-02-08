# 扫码充值功能说明

## 概述

系统已成功集成扫码充值功能，用户可以通过扫描收款码进行支付，然后上传支付凭证，管理员审核后自动增加积分。

## 功能特点

1. **扫码充值**：支持微信和支付宝扫码支付
2. **上传凭证**：用户上传支付凭证截图
3. **管理员审核**：管理员审核通过后增加积分
4. **手动充值**：管理员可以直接给用户增加积分

## 充值流程

### 用户端

1. 登录系统
2. 进入定价页面 `/pricing`
3. 选择充值档位
4. 点击"扫码充值"按钮
5. 扫描收款码（微信或支付宝）
6. 支付成功后，截图保存支付凭证
7. 上传支付凭证图片
8. 提交审核
9. 等待管理员审核通过
10. 积分自动增加

### 管理员端

1. 查看待审核订单
2. 验证支付凭证
3. 确认支付金额正确
4. 使用管理员接口增加积分
5. 完成审核

## 接口说明

### 1. 扫码充值接口

**接口地址**：`POST /api/user/topup-qrcode`

**请求参数**：
```json
{
  "tierId": "credits_10",
  "receiptFileKey": "file_key_from_storage"
}
```

**响应**：
```json
{
  "message": "充值订单创建成功，请等待管理员审核",
  "outTradeNo": "QRCODE_1_1234567890",
  "tier": {
    "id": "credits_10",
    "name": "入门包",
    "credits": 10,
    "price": 5
  },
  "status": "pending"
}
```

### 2. 管理员充值接口

**接口地址**：`POST /api/admin/add-credits-by-email`

**请求参数**：
```json
{
  "email": "user@example.com",
  "credits": 10,
  "description": "审核通过：充值10积分"
}
```

**响应**：
```json
{
  "message": "充值成功",
  "userId": 1,
  "email": "user@example.com",
  "creditsAdded": 10,
  "newBalance": 10
}
```

### 3. 带管理员密钥的充值接口（可选）

**接口地址**：`POST /api/admin/add-credits`

**请求头**：
```
x-admin-secret: admin_secret_key
```

**请求参数**：
```json
{
  "email": "user@example.com",
  "credits": 10,
  "description": "管理员手动充值"
}
```

## 配置收款码

### 添加收款码图片

1. 准备一张收款码图片（微信或支付宝）
2. 将图片命名为 `qrcode.jpg`
3. 放置在 `public/` 目录下

详细说明请查看：`public/QRCODE-README.md`

### 验证收款码

访问定价页面：`http://localhost:5000/pricing`

点击"扫码充值"按钮，应该能看到收款码图片。

## 查看待审核订单

### SQL查询

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

## 使用示例

### 用户充值

1. 登录系统
2. 访问 `/pricing`
3. 点击"扫码充值"
4. 扫码支付
5. 上传凭证
6. 提交审核

### 管理员审核

```bash
# 使用管理员接口增加积分
curl -X POST http://localhost:5000/api/admin/add-credits-by-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "credits": 10,
    "description": "审核通过：充值10积分"
  }'
```

## 注意事项

1. **收款码安全**：收款码图片会公开显示，确保收款码安全
2. **审核时效**：建议在1-2小时内完成审核
3. **支付验证**：仔细核对支付凭证，防止虚假充值
4. **订单状态**：及时更新订单状态，避免重复处理
5. **支付金额**：确保用户支付的金额与充值档位金额一致

## 文档说明

- `QRCODE-SETUP.md` - 收款码配置详细指南
- `public/QRCODE-README.md` - 收款码图片添加说明
- `ALIPAY-INTEGRATION.md` - 支付宝在线支付文档（可选）

## 支付方式对比

| 支付方式 | 自动化程度 | 配置难度 | 适用场景 |
|---------|-----------|---------|---------|
| 扫码充值 | 需要人工审核 | 简单 | 个人收款、小规模 |
| 管理员充值 | 手动操作 | 简单 | 测试、特殊场景 |
| 支付宝在线 | 完全自动 | 复杂 | 大规模、自动化 |

## 技术支持

如遇到问题，请查看：
1. 服务器日志：`/app/work/logs/bypass/app.log`
2. 数据库订单状态
3. 对象存储中的支付凭证文件
