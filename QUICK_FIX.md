# 快速解决飞书链接无法访问的问题

## 🔍 问题分析

你遇到的问题可能是：
1. 设备不在同一个局域网
2. IP地址是内网地址，外网无法访问
3. 防火墙阻止了外部连接

## 🚀 最快解决方案：使用 ngrok（5分钟搞定）

### 第一步：下载安装 ngrok

#### macOS:
```bash
brew install ngrok
```

#### Linux:
```bash
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
sudo tar xvzf ngrok-v3-stable-linux-amd64.tgz -C /usr/local/bin
```

#### Windows:
1. 访问 https://ngrok.com/download
2. 下载 Windows 版本
3. 解压到某个目录（如 C:\ngrok）

### 第二步：注册并认证

1. 访问 https://ngrok.com/ 注册账号
2. 登录后获取你的 authtoken
3. 在终端运行：
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 第三步：启动 ngrok

```bash
ngrok http 5000
```

你会看到：
```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:5000
```

**复制这个 https:// 开头的地址！**

### 第四步：修改配置

编辑 `.env.local` 文件：
```bash
NEXT_PUBLIC_APP_URL=https://xxxx-xx-xx-xx-xx.ngrok-free.app
```

### 第五步：重启服务

```bash
coze dev
```

### 第六步：测试

现在：
1. 提交一个充值请求
2. 飞书收到消息
3. 点击"前往审核"
4. ✅ 应该能正常打开了！

## 🎯 完成！

现在你的应用就有了公网可访问的地址，任何地方都能打开！

## 💡 提示

- ngrok 免费版的地址每次重启都会变化
- 建议付费获得固定域名（每月5美元起）
- ngrok 自动提供 HTTPS，无需配置证书

## 📱 现在可以在以下设备访问

✅ 手机（任何网络）
✅ 平板（任何网络）
✅ 电脑（任何网络）
✅ 飞书消息中的链接

开始吧！🚀
