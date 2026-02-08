# 腾讯云服务器配置指南

## 📋 配置步骤概览

### 第一步：了解服务器环境
需要确认服务器已安装的软件和配置

### 第二步：部署应用到服务器
- 安装 Node.js 环境
- 上传应用代码
- 安装依赖
- 启动应用

### 第三步：配置 HTTPS（SSL证书）
- 使用 Let's Encrypt 免费证书
- 或使用腾讯云 SSL 证书

### 第四步：配置 Nginx 反向代理
- 配置 HTTP → HTTPS 重定向
- 配置反向代理到 Node.js 应用

### 第五步：配置飞书网页应用
- 在飞书开放平台创建网页应用
- 配置首页地址

---

## 🤔 需要确认的信息

在开始之前，请告诉我以下信息：

### 服务器信息
1. **服务器操作系统**？
   - Ubuntu
   - CentOS
   - Debian
   - 其他

2. **服务器登录方式**？
   - SSH 用户名和密码
   - SSH 密钥
   - 腾讯云控制台 WebShell

3. **服务器已安装的软件**？（请运行以下命令查看）
```bash
node --version
npm --version
pm2 --version
nginx -v
```

4. **你有域名吗？**
   - ✅ 有（请提供域名）
   - ❌ 没有（使用 IP 地址：43.161.218.176）

---

## 🚀 快速配置（推荐流程）

### 如果服务器是全新环境，按照以下步骤：

```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian

# 2. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. 安装 PM2（进程管理）
sudo npm install -g pm2

# 4. 确认已安装 Nginx（腾讯云默认已安装）
nginx -v

# 5. 安装 Certbot（用于 SSL 证书）
sudo apt install -y certbot python3-certbot-nginx
```

---

## 📦 部署应用

### 方式1：使用 Git 部署（推荐）
```bash
# 1. 克隆代码到服务器
git clone https://github.com/your-repo.git /var/www/stock-analysis

# 2. 进入目录
cd /var/www/stock-analysis

# 3. 安装依赖
npm install

# 4. 构建生产版本
npm run build

# 5. 启动应用
pm2 start npm --name "stock-analysis" -- start

# 6. 设置开机自启
pm2 startup
pm2 save
```

### 方式2：手动上传
```bash
# 1. 使用 SCP 或 SFTP 上传代码
scp -r /path/to/local/project user@43.161.218.176:/var/www/stock-analysis

# 2. SSH 登录服务器
ssh user@43.161.218.176

# 3. 安装依赖
cd /var/www/stock-analysis
npm install
npm run build

# 4. 启动应用
pm2 start npm --name "stock-analysis" -- start
```

---

## 🔐 配置 HTTPS

### 使用 Let's Encrypt 免费证书

```bash
# 1. 获取 SSL 证书（如果有域名）
sudo certbot --nginx -d your-domain.com

# 2. 如果使用 IP 地址（需要使用腾讯云 SSL 证书）
# 访问腾讯云控制台 -> SSL 证书 -> 申请免费证书
# 下载证书并配置到 Nginx
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name 43.161.218.176;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name 43.161.218.176;

    # SSL 证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 反向代理到 Node.js 应用
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📱 配置飞书网页应用

### 步骤1：创建网页应用
1. 访问 https://open.feishu.cn/
2. 进入你的应用
3. 点击"网页应用"
4. 点击"添加网页应用"

### 步骤2：配置基本信息
- 应用名称：股票分析充值审核
- 应用描述：管理用户充值审核

### 步骤3：配置地址
- 首页地址：`https://43.161.218.176/admin/topup`
- 移动端首页地址：`https://43.161.218.176/admin/topup`

### 步骤4：修改飞书消息链接
将飞书消息中的链接改为指向飞书网页应用。

---

## ⚠️ 注意事项

### 关于 HTTPS 和 IP 地址
1. Let's Encrypt 证书不支持 IP 地址，只支持域名
2. 如果使用 IP 地址，需要使用腾讯云 SSL 证书或其他商业证书
3. 建议购买一个域名，然后配置 DNS 解析

### 关于飞书个人版
1. 飞书个人版可能不支持网页应用功能
2. 建议升级到企业版
3. 或使用普通链接方式（不需要网页应用）

---

## 🎯 下一步

请告诉我：
1. 服务器的操作系统？
2. 服务器已安装哪些软件？（运行上面的命令查看）
3. 你有域名吗？
4. 你的飞书账号是个人版还是企业版？

根据你的回答，我会提供具体的配置命令！
