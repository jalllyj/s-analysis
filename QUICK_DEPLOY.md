# 快速部署方案（无需传输文件）

## 🚀 方案：在腾讯云服务器上直接创建项目

由于沙箱环境限制，我们使用**Base64 编码脚本**的方式，你只需要在腾讯云服务器上复制并执行一个命令即可。

---

## 📋 部署步骤

### 第一步：SSH 登录腾讯云服务器

```bash
ssh root@43.161.218.176
```

### 第二步：创建并执行部署脚本

复制以下命令并粘贴到腾讯云服务器的终端中：

```bash
cd /tmp && curl -sL 'https://raw.githubusercontent.com/your-repo/deploy.sh' | bash
```

**但是等等！** 由于你还没有将脚本上传到公开地址，我提供一个更简单的方法：

---

## 🎯 简化方案：分步创建项目

由于文件传输困难，我们采用**分步创建**的方式：

### 步骤1：创建项目目录和基础配置

```bash
# 在腾讯云服务器上执行
mkdir -p /var/www/stock-analysis
cd /var/www/stock-analysis

# 创建 package.json
cat > package.json << 'EOF'
{
  "name": "stock-analysis",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "16.1.1",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "bcryptjs": "^3.0.3",
    "jose": "^6.1.3",
    "drizzle-orm": "^0.45.1",
    "drizzle-zod": "^0.8.3",
    "pg": "^8.17.2",
    "xlsx": "^0.18.5",
    "coze-coding-dev-sdk": "^0.7.15",
    "zod": "^4.3.5",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.468.0",
    "sonner": "^2.0.7"
  }
}
EOF

# 安装依赖
npm install
```

### 步骤2：创建配置文件

```bash
# 创建 .env.local
cat > .env.local << 'EOF'
FEISHU_APP_ID=cli_a90278570b38dcc7
FEISHU_APP_SECRET=SPcbpXPHXDNKlG1HGgSgFdrdl723PpUs
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/0e1f2e46-0f44-4dff-ac55-c6ffb12ee77f
NEXT_PUBLIC_APP_URL=https://43.161.218.176
# DATABASE_URL=请从沙箱复制数据库连接字符串
EOF
```

**重要：** 你需要从沙箱获取 `DATABASE_URL`：

在沙箱中运行：
```bash
cat .env.local | grep DATABASE_URL
```

复制这个值，然后粘贴到腾讯云服务器的 `.env.local` 文件中。

### 步骤3：手动复制代码文件

由于无法传输文件，你有以下选择：

**选择A：使用 Git（如果有仓库）**
```bash
git clone https://github.com/your-username/your-repo.git .
```

**选择B：手动创建文件**
告诉我你想采用哪种方式，我可以提供更详细的指导。

---

## 💡 我的建议

### 最佳方案：使用 Git 仓库

1. **在沙箱中提交代码到 GitHub**
   ```bash
   cd /workspace/projects
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/stock-analysis.git
   git push -u origin main
   ```

2. **在腾讯云服务器上克隆代码**
   ```bash
   cd /var/www
   git clone https://github.com/你的用户名/stock-analysis.git
   cd stock-analysis
   npm install
   npm run build
   ```

3. **配置 SSL 和 Nginx**（见下方）

---

## 🔐 配置 SSL 和 Nginx

```bash
# 生成 SSL 证书
mkdir -p /etc/nginx/ssl
cd /etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key \
  -out server.crt \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=MyCompany/CN=43.161.218.176"
chmod 600 server.key
chmod 644 server.crt

# 配置 Nginx
cat > /etc/nginx/conf.d/stock-analysis.conf << 'EOF'
server {
    listen 80;
    server_name 43.161.218.176;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 43.161.218.176;

    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 重启 Nginx
nginx -t
systemctl restart nginx
```

---

## 🚀 启动应用

```bash
# 使用 PM2 启动
cd /var/www/stock-analysis
pm2 start npm --name "stock-analysis" -- start

# 设置开机自启
pm2 startup
pm2 save
```

---

## ✅ 完成！

访问：https://43.161.218.176

---

## 🤔 你需要什么帮助？

请告诉我：
1. **你有 GitHub 账号吗？** 我可以帮你提交代码
2. **你想继续手动创建文件吗？** 我可以提供详细的文件列表和内容
3. **或者你有其他想法？**

**根据你的选择，我会提供相应的指导！** 🚀
