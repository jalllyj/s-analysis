# 飞书网页应用配置指南

## 📋 前提条件

1. 已有飞书企业账号
2. 拥有飞书开放平台的管理员权限
3. 已获取飞书 App ID 和 App Secret

## 🔧 飞书开放平台配置步骤

### 1. 创建应用

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 点击"创建应用"
3. 选择"企业自建应用"
4. 填写应用名称和描述
5. 创建成功后，进入应用管理页面

### 2. 获取凭证

1. 在应用管理页面，点击左侧"凭证与基础信息"
2. 复制 `App ID` 和 `App Secret`
3. 将这些信息添加到项目的 `.env.local` 文件中

### 3. 配置重定向 URL

1. 点击左侧"安全设置" → "重定向 URL"
2. 添加重定向 URL（根据您的部署环境）：
   ```
   http://9.129.6.176:5000/api/feishu/oauth/callback
   ```
   或
   ```
   https://your-domain.com/api/feishu/oauth/callback
   ```

### 4. 配置权限

1. 点击左侧"权限管理"
2. 搜索并添加以下权限：
   - `contact:user.base:readonly` - 获取用户基本信息

### 5. 启用网页应用

1. 点击左侧"网页应用"
2. 启用网页应用功能
3. 配置应用主页 URL：
   ```
   http://9.129.6.176:5000/feishu
   ```
   或
   ```
   https://your-domain.com/feishu
   ```
4. 配置移动端主页 URL（与主页相同）

### 6. 发布应用

1. 点击"发布" → "发布版本"
2. 填写版本信息
3. 提交审核

### 7. 添加到飞书

1. 发布成功后，在"管理后台" → "工作台"
2. 找到您的应用
3. 点击"添加到工作台"
4. 选择可见范围（建议选择特定部门或用户）

### 8. 获取应用 URL

1. 在飞书客户端打开应用
2. 复制应用的 URL（格式如：`https://your-company.feishu.cn/app/your-app-id`）
3. 将此 URL 添加到 `.env.local` 文件中：
   ```env
   FEISHU_APP_URL=https://your-company.feishu.cn/app/your-app-id
   ```

## 📝 .env.local 配置示例

```env
# 飞书应用配置
FEISHU_APP_ID=cli_a90278570b38dcc7
FEISHU_APP_SECRET=your_app_secret_here
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/your-webhook-id

# 应用访问地址
NEXT_PUBLIC_APP_URL=http://9.129.6.176:5000

# 飞书应用地址（从飞书客户端获取）
FEISHU_APP_URL=https://your-company.feishu.cn/app/your-app-id

# JWT 密钥
JWT_SECRET=your-secret-key-here

# 飞书 App ID（前端使用）
NEXT_PUBLIC_FEISHU_APP_ID=cli_a90278570b38dcc7
```

## 🚀 使用流程

### 1. 首次访问

1. 用户在飞书中打开应用
2. 自动跳转到飞书 OAuth 授权页面
3. 用户点击"授权"
4. 获取飞书用户信息并登录

### 2. 审核流程

1. 用户提交充值请求
2. 系统发送飞书消息通知管理员
3. 管理员在飞书中点击"通过"或"拒绝"按钮
4. 自动跳转到飞书应用审核页面
5. 如果未登录，自动触发飞书登录
6. 审核完成后返回应用首页

### 3. 权限管理

飞书应用用户默认拥有管理员权限，可以：
- 审核充值请求
- 查看用户信息
- 管理系统数据

## ⚠️ 注意事项

1. **HTTPS 要求**：生产环境必须使用 HTTPS
2. **域名白名单**：确保您的域名已添加到飞书应用的白名单
3. **权限范围**：只申请必要的权限
4. **应用审核**：发布应用需要经过飞书审核，通常需要 1-3 个工作日

## 🔍 调试技巧

### 查看日志

```bash
# 开发日志
tail -n 20 /app/work/logs/bypass/dev.log

# 应用日志
tail -n 20 /app/work/logs/bypass/app.log
```

### 测试 OAuth 流程

1. 访问 `http://9.129.6.176:5000/feishu`
2. 检查是否正常跳转到飞书登录页
3. 登录后检查是否正常返回应用
4. 检查用户信息是否正确

### 测试审核流程

1. 提交一个充值请求
2. 在飞书中查看收到的消息
3. 点击审核按钮
4. 检查是否正常跳转和审核

## 📚 相关文档

- [飞书开放平台文档](https://open.feishu.cn/document/)
- [飞书网页应用开发指南](https://open.feishu.cn/document/ukTMukTMukTM/uEjNwUjLxYDM14iN2ATN)
- [飞书 OAuth 文档](https://open.feishu.cn/document/common-capabilities/sso/api/get-user-info)
