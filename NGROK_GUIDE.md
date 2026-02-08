# 使用 ngrok 快速创建公网访问地址

## 什么是 ngrok？

ngrok 是一个内网穿透工具，可以把本地的 localhost 暴露到公网，让任何地方都能访问。

## 快速开始（2分钟搞定）

### 步骤1：安装 ngrok

1. 访问 ngrok 官网：https://ngrok.com/
2. 注册账号（免费）
3. 下载 ngrok 客户端

### 步骤2：运行 ngrok

在终端中运行：

```bash
ngrok http 5000
```

你会看到类似这样的输出：

```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:5000
```

复制这个 `https://xxxx-xx-xx-xx-xx.ngrok-free.app` 地址。

### 步骤3：修改配置

将 `.env.local` 中的 `NEXT_PUBLIC_APP_URL` 改为 ngrok 提供的地址：

```bash
NEXT_PUBLIC_APP_URL=https://xxxx-xx-xx-xx-xx.ngrok-free.app
```

### 步骤4：重启服务

重启开发服务器：

```bash
coze dev
```

### 步骤5：测试

现在飞书消息中的链接会使用公网地址，任何设备都能访问了！

## 注意事项

- 免费版 ngrok 的 URL 每次重启都会变化
- 建议升级到付费版以获得固定域名
- ngrok 会生成 HTTPS 证书，自动支持 HTTPS

## 其他内网穿透工具

除了 ngrok，你还可以使用：

1. **花生壳**（国内）- https://hsk.oray.com/
2. **frp**（自建）- https://github.com/fatedier/frp
3. **cpolar**（国内）- https://www.cpolar.com/
