# 腾讯云服务器部署完整指南

## 📦 代码已打包

代码已经打包完成：
- 文件路径：`/tmp/stock-analysis-deploy.tar.gz`
- 文件大小：597K

## 🚀 完整部署步骤

### 步骤1：下载部署包（在沙箱中）

首先需要将部署包下载到本地电脑，然后上传到服务器。

**在沙箱中执行：**
```bash
# 在本地电脑上，通过以下方式下载：
# 1. 如果你有 SSH 访问权限
scp root@沙箱IP:/tmp/stock-analysis-deploy.tar.gz ./

# 2. 或者使用文件管理工具（FileZilla等）下载

# 3. 或者告诉我，我帮你通过其他方式传输
```

**或者直接复制文件内容：**
由于文件较大（597K），建议使用 scp 或文件管理工具下载。

---

### 步骤2：上传到腾讯云服务器

将下载的文件上传到腾讯云服务器：

**在本地电脑上执行：**
```bash
# 替换 root 为你的服务器用户名（如果不是 root）
scp stock-analysis-deploy.tar.gz root@43.161.218.176:/root/
```

---

### 步骤3：在服务器上部署

SSH 登录到腾讯云服务器：

```bash
ssh root@43.161.218.176
```

**执行以下命令：**

```bash
# 1. 创建应用目录
mkdir -p /var/www/stock-analysis
cd /var/www/stock-analysis

# 2. 解压部署包
tar -xzf /root/stock-analysis-deploy.tar.gz

# 3. 创建 .env.local 文件
cat > .env.local << 'EOF'
# 飞书应用配置
FEISHU_APP_ID=cli_a90278570b38dcc7
FEISHU_APP_SECRET=SPcbpXPHXDNKlG1HGgSgFdrdl723PpUs
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/0e1f2e46-0f44-4dff-ac55-c6ffb12ee77f

# 应用访问地址（重要！）
NEXT_PUBLIC_APP_URL=https://43.161.218.176

# 数据库配置（从沙箱的 .env.local 复制）
DATABASE_URL=你的数据库连接字符串
EOF

# 注意：需要从沙箱复制数据库配置到服务器

# 4. 安装依赖
npm install

# 5. 构建生产版本
npm run build

# 6. 测试启动（先测试一下）
npm run start

# 按 Ctrl+C 停止
```

---

### 步骤4：配置 SSL 证书

#### 方式1：使用腾讯云免费 SSL 证书（推荐）

**在腾讯云控制台操作：**
1. 访问：https://console.cloud.tencent.com/ssl
2. 点击"申请免费证书"
3. 填写信息：
   - 域名/IP：`43.161.218.176`
   - 验证方式：选择"文件验证"
4. 提交申请，等待审核（通常 1-2 小时）

**审核通过后下载证书：**
1. 下载 Nginx 格式的证书
2. 解压后得到两个文件：
   - `xxx.crt` (证书文件)
   - `xxx.key` (私钥文件)

**上传到服务器：**
```bash
# 在本地电脑执行
scp xxx.crt xxx.key root@43.161.218.176:/etc/nginx/ssl/
```

#### 方式2：使用自签名证书（快速但会有警告）

```bash
# 在服务器上执行
mkdir -p /etc/nginx/ssl
cd /etc/nginx/ssl

# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key \
  -out server.crt \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=MyCompany/CN=43.161.218.176"
```

**注意：** 自签名证书会在浏览器中显示"不安全"警告，但功能正常。

---

### 步骤5：配置 Nginx

**创建 Nginx 配置文件：**

```bash
# 在服务器上执行
nano /etc/nginx/conf.d/stock-analysis.conf
```

**粘贴以下配置：**

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name 43.161.218.176;

    # 重定向所有 HTTP 请求到 HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS 服务器配置
server {
    listen 443 ssl http2;
    server_name 43.161.218.176;

    # SSL 证书配置（根据你的实际情况修改路径）
    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 日志配置
    access_log /var/log/nginx/stock-analysis-access.log;
    error_log /var/log/nginx/stock-analysis-error.log;

    # 反向代理到 Node.js 应用
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;

        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # 代理头设置
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 不缓存
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # 缓存 7 天
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

**测试并重启 Nginx：**

```bash
# 测试配置是否正确
nginx -t

# 如果没有错误，重启 Nginx
systemctl restart nginx

# 设置 Nginx 开机自启
systemctl enable nginx
```

---

### 步骤6：使用 PM2 启动应用

**在服务器上执行：**

```bash
# 切换到应用目录
cd /var/www/stock-analysis

# 使用 PM2 启动应用
pm2 start npm --name "stock-analysis" -- start

# 查看应用状态
pm2 status

# 查看日志
pm2 logs stock-analysis

# 设置 PM2 开机自启
pm2 startup
pm2 save
```

---

### 步骤7：测试访问

**在浏览器中访问：**

```
https://43.161.218.176
```

**如果看到页面，说明部署成功！**

**测试 API：**

```bash
# 测试充值页面
curl https://43.161.218.176/pricing

# 测试管理后台
curl https://43.161.218.176/admin/topup
```

---

## 🔧 常见问题

### 问题1：端口 5000 已被占用

```bash
# 查找占用端口的进程
lsof -i :5000

# 或
netstat -tulnp | grep 5000

# 杀死进程
kill -9 <PID>
```

### 问题2：Nginx 配置测试失败

```bash
# 查看错误日志
nginx -t

# 查看详细错误
tail -f /var/log/nginx/error.log
```

### 问题3：应用启动失败

```bash
# 查看 PM2 日志
pm2 logs stock-analysis

# 查看错误信息
pm2 show stock-analysis
```

### 问题4：SSL 证书错误

```bash
# 确认证书路径
ls -la /etc/nginx/ssl/

# 检查证书权限
chmod 600 /etc/nginx/ssl/server.key
chmod 644 /etc/nginx/ssl/server.crt
```

---

## 📱 更新飞书消息链接

部署成功后，修改沙箱中的配置：

```bash
# 在沙箱中
nano .env.local
```

修改：
```bash
NEXT_PUBLIC_APP_URL=https://43.161.218.176
```

重启服务后，飞书消息中的链接会自动更新。

---

## 🎉 完成！

现在你的应用已经成功部署到腾讯云服务器，可以通过 HTTPS 访问了！

**访问地址：**
- 主页：`https://43.161.218.176`
- 充值页面：`https://43.161.218.176/pricing`
- 管理后台：`https://43.161.218.176/admin/topup`

---

## 📝 后续维护

### 更新应用

```bash
# 1. 停止应用
pm2 stop stock-analysis

# 2. 上传新代码
# 3. 解压覆盖
# 4. 安装依赖
npm install

# 5. 重新构建
npm run build

# 6. 重启应用
pm2 restart stock-analysis
```

### 查看日志

```bash
# PM2 日志
pm2 logs stock-analysis

# Nginx 访问日志
tail -f /var/log/nginx/stock-analysis-access.log

# Nginx 错误日志
tail -f /var/log/nginx/stock-analysis-error.log
```

---

## 🆘 需要帮助？

如果遇到问题，告诉我具体的错误信息，我会帮你解决！
