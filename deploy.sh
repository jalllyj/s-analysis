#!/bin/bash

# ========================================
# 股票分析应用 - 一键部署脚本
# ========================================

set -e  # 遇到错误立即退出

echo "🚀 开始部署股票分析应用..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查必要的命令
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ 未找到命令: $1${NC}"
        echo "请先安装: $1"
        exit 1
    fi
}

echo "📋 检查系统环境..."
check_command "node"
check_command "npm"
check_command "pm2"
check_command "nginx"
echo -e "${GREEN}✅ 系统环境检查通过${NC}"
echo ""

# 创建应用目录
echo "📁 创建应用目录..."
APP_DIR="/var/www/stock-analysis"
sudo mkdir -p $APP_DIR
cd $APP_DIR
echo -e "${GREEN}✅ 目录创建成功: $APP_DIR${NC}"
echo ""

# 创建 package.json
echo "📦 创建 package.json..."
cat > package.json << 'EOF'
{
  "name": "stock-analysis",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "coze dev",
    "build": "coze build",
    "start": "coze start"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.958.0",
    "@aws-sdk/lib-storage": "^3.958.0",
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-aspect-ratio": "^1.1.8",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-context-menu": "^2.2.16",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-hover-card": "^1.1.15",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-menubar": "^1.1.16",
    "@radix-ui/react-navigation-menu": "^1.2.14",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-toggle-group": "^1.1.11",
    "@radix-ui/react-tooltip": "^1.2.8",
    "bcrypt": "^6.0.0",
    "bcryptjs": "^3.0.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.4.1",
    "coze-coding-dev-sdk": "^0.7.15",
    "date-fns": "^4.1.0",
    "drizzle-kit": "^0.31.8",
    "drizzle-orm": "^0.45.1",
    "drizzle-zod": "^0.8.3",
    "embla-carousel-react": "^8.6.0",
    "input-otp": "^1.4.2",
    "jose": "^6.1.3",
    "lucide-react": "^0.468.0",
    "next": "16.1.1",
    "next-themes": "^0.4.6",
    "pg": "^8.17.2",
    "react": "19.2.3",
    "react-day-picker": "^9.13.0",
    "react-dom": "19.2.3",
    "react-hook-form": "^7.70.0",
    "react-resizable-panels": "^4.2.0",
    "recharts": "2.15.4",
    "sonner": "^2.0.7",
    "tailwind-merge": "^2.6.0",
    "tw-animate-css": "^1.4.0",
    "vaul": "^1.1.2",
    "xlsx": "^0.18.5",
    "zod": "^4.3.5"
  },
  "devDependencies": {
    "@react-dev-inspector/babel-plugin": "^2.0.1",
    "@react-dev-inspector/middleware": "^2.0.1",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/pg": "^8.16.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.1",
    "only-allow": "^1.2.2",
    "react-dev-inspector": "^2.0.1",
    "shadcn": "latest",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
EOF
echo -e "${GREEN}✅ package.json 创建成功${NC}"
echo ""

# 创建 .env.local
echo "⚙️  创建配置文件..."
cat > .env.local << 'EOF'
# 飞书应用配置
FEISHU_APP_ID=cli_a90278570b38dcc7
FEISHU_APP_SECRET=SPcbpXPHXDNKlG1HGgSgFdrdl723PpUs
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/0e1f2e46-0f44-4dff-ac55-c6ffb12ee77f

# 应用访问地址
NEXT_PUBLIC_APP_URL=https://43.161.218.176

# 数据库配置（需要从沙箱复制）
# DATABASE_URL=postgresql://user:password@host:port/database

# 支付宝配置（可选）
ALIPAY_APP_ID=2088222913445842
ALIPAY_PRIVATE_KEY=MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCaNqDDD9SJgz6VDoGh0CqtcmhA2scCRG/UNtq4WHZPAv3BZXK+P6GRfvTKqUE1QpxvmxRtkQbh3aq4miWQiUt32wI8FtK0cKx5EoFVhN8VzJ/ZiyQVsfuHdfLXDiruIAtkV2y5apmlUDYtL1wHbBcl5rB9vkD2B4MQH3mkdUjmr8eMgzJQlSCzWKVdxAdgfO2ypCVMAtmn0Q9T74sI8dU/ZzmKmPBfnjtcfmnpKusBkhoF+H4RSqVMhANCnsyMVMuZj8Gg3yuMqL5oItoRd1tAAAJxrXtWPUx9ikfE83sC8PGV9mqY+ADBcmGR6jcjh5D41PJPIO7t/iRwiKMHYHEPAgMBAAECggEAGIYTbrG3xN6AN0gFSWxHPSnydk3UVAH6Hq9SfPpkZhA9tmGhq6uG0BJ2bzwXSJb9Napdx0bG52hO2+h3jNKok7jaVB/1BgjdBKvysVzd9SODUB8Wb/TL4TDam2R/YzrpVN2qRpozMNzeoLTlV7DSxY44BucYgYeUSh4XRBX6r+SIiokdUp+VaYdEb0OFJV7icN8FXnOH0Z0apW3oy6sZVX8U01tEqUX8mO/s6+3ZxpzbBJPVSddizKPK3CexAUBfH+4IciFyJs4WaPTECEc1laZ0Cx5bi5zBb6u3ou8I0FaYfIxLr6WfHxfTrnOr/l2tynmTYY4Rre35PGkMKxyBwQKBgQDh1wQYGa/dka9IBXKzVMv399r+MqrolOQELAvVRcyhZvQomUruKLemcWtq/9FdJC2hh5AnyByulA95LUMEGk3Z78Z/UY3iXF9mEcgqjLox2TT1jhYK9d+q/DLATbK1+z2sFpxl2KUVHLMnZ8PNp0kE2u9cWXbNp/m08U+M+MbSvwKBgQCuztq6Oh2cHzzYJikIwu8C//g12ZqZpi+BfUIgVCudD4KuPGrYfhHRBt39yQFg85UQ8sSmUkzyciPiqRHE+7634fV2xfYmDofN+HGnF5kB+w6bdzU31QjcfwEuYgODwYM0hUbadFd4bGygPk7VHw8JrmT5qMtoXC6bW5lcTfUFsQKBgFZJoPbUWa1+jEooSrraG1STDskw8rwKp1QwwBSsppLEk2UvrMFyLTka/L/VHllICWc+NIX+n3bUe1UBRim7IyOxyVW8A0oJoSmOgbxAKKQDKYjo0OM/LkZWNc3j4fRGGjo2KWuAaxK19H2J1/YrhGqme+39ALdzBqVrzck/BDhhAoGBAIK6WWLZoVknF0aCSz+tIDd7G7GR2Yc8e9x3wyMQL0mW1uDcd/8NUN+kJhHr52cM4pa5Jw1HERpi96lDTPGmXrt/dSVs6CcPyMnlGYGfKSMNEKB9JsRpQeY76LM6Q2yeJDP707/9L4j0dMvlrOi/AGz6CbOXYv7ZqVUvzGH2Pt4RAoGBANxRKsOLOrErT2kLCUH2SDDWTTU9yW8HuvRxT624es70T5+juK2+xw8Zyb00UrTlNdZ+O8VJ/lEXApAO9cy2XEXZTA4uqaqdyiPUQ6ZKK5P5fjrwWGD9MQ2aGhToBo195LzACyjPY2r71moBUx3UtUsV7JB4dJrVG98fTdwuTZBk
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr42qN4RsJO8RlM9FzbYlh0spMCgXrUm1ETx+Q+V8JZ/RzcoZHNcI3Ybqa+JvxKYQreYEriHqQnL3+r4f9v114WruYTVu0iNQfGa+w6FRkMMewPFzNSKsVO7bJkDzUPPPTPUPcgAoz60XxP1IuD8u8k0XAcFd0Q5EWiixRiKTKZgyftBVoVc8NHSzJu8hoNfYi1YMdaih2Ta2CvybpYhTirhwIJmFhPlA/jfDgmZw+qnTlSlCCwuODpef9jKHDUiAt9DivizJw6BJCNeo38S8ekwuywVruX36VugPq2g3840LcohQW0h62FgWXGDtgnt254H2gg25mHDKTGA/v2gmEQIDAQAB
ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do
ALIPAY_SANDBOX=false
EOF
echo -e "${GREEN}✅ .env.local 创建成功${NC}"
echo ""
echo -e "${YELLOW}⚠️  重要：请手动配置 DATABASE_URL${NC}"
echo "   运行以下命令添加数据库配置："
echo "   nano .env.local"
echo "   然后添加: DATABASE_URL=你的数据库连接字符串"
echo ""

# 创建 tsconfig.json
echo "📝 创建 TypeScript 配置..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
echo -e "${GREEN}✅ tsconfig.json 创建成功${NC}"
echo ""

# 创建 next.config.ts
echo "⚙️  创建 Next.js 配置..."
cat > next.config.ts << 'EOF'
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
};

export default nextConfig;
EOF
echo -e "${GREEN}✅ next.config.ts 创建成功${NC}"
echo ""

# 创建 tailwind.config.ts
echo "🎨 创建 Tailwind 配置..."
cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
EOF
echo -e "${GREEN}✅ tailwind.config.ts 创建成功${NC}"
echo ""

# 创建 postcss.config.mjs
echo "📝 创建 PostCSS 配置..."
cat > postcss.config.mjs << 'EOF'
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
EOF
echo -e "${GREEN}✅ postcss.config.mjs 创建成功${NC}"
echo ""

# 创建 .coze 配置
echo "⚙️  创建 Coze 配置..."
cat > .coze << 'EOF'
[project]
requires = ["nodejs-24"]

[dev]
build = ["pnpm", "install"]
run = ["pnpm", "run", "dev"]

[deploy]
build = ["pnpm", "run", "build"]
run = ["pnpm", "run", "start"]
EOF
echo -e "${GREEN}✅ .coze 创建成功${NC}"
echo ""

# 创建 .npmrc
echo "📝 创建 npm 配置..."
cat > .npmrc << 'EOF'
auto-install-peers = true
strict-peer-dependencies = false
EOF
echo -e "${GREEN}✅ .npmrc 创建成功${NC}"
echo ""

# 提示用户手动复制代码文件
echo -e "${YELLOW}⚠️  需要手动复制以下文件到服务器：${NC}"
echo ""
echo "需要复制的文件列表："
echo "  1. src/ 目录及其所有内容"
echo "  2. public/ 目录及其所有内容"
echo "  3. drizzle.config.ts"
echo "  4. .cozeproj/ 目录"
echo ""
echo -e "${YELLOW}💡 建议：${NC}"
echo "   如果你有 Git 仓库，直接执行："
echo "   git clone <你的仓库地址> ."
echo ""
read -p "是否已经复制好所有文件？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ 请先复制文件，然后重新运行脚本${NC}"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install
echo -e "${GREEN}✅ 依赖安装成功${NC}"
echo ""

# 构建应用
echo "🔨 构建应用..."
npm run build
echo -e "${GREEN}✅ 应用构建成功${NC}"
echo ""

# 配置 SSL 证书
echo "🔐 配置 SSL 证书..."
mkdir -p /etc/nginx/ssl
cd /etc/nginx/ssl

# 检查是否已有证书
if [ ! -f server.crt ] || [ ! -f server.key ]; then
    echo "📝 生成自签名 SSL 证书..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout server.key \
      -out server.crt \
      -subj "/C=CN/ST=Beijing/L=Beijing/O=MyCompany/CN=43.161.218.176"
    chmod 600 server.key
    chmod 644 server.crt
    echo -e "${GREEN}✅ SSL 证书生成成功${NC}"
else
    echo -e "${GREEN}✅ SSL 证书已存在${NC}"
fi
echo ""

# 配置 Nginx
echo "🌐 配置 Nginx..."
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

# 测试 Nginx 配置
nginx -t
if [ $? -eq 0 ]; then
    systemctl restart nginx
    echo -e "${GREEN}✅ Nginx 配置成功${NC}"
else
    echo -e "${RED}❌ Nginx 配置失败${NC}"
    exit 1
fi
echo ""

# 使用 PM2 启动应用
echo "🚀 启动应用..."
cd $APP_DIR
pm2 delete stock-analysis 2>/dev/null || true
pm2 start npm --name "stock-analysis" -- start
pm2 save
echo -e "${GREEN}✅ 应用启动成功${NC}"
echo ""

# 设置 PM2 开机自启
echo "⚙️  设置开机自启..."
pm2 startup systemd -u root --hp /root
echo -e "${GREEN}✅ 开机自启配置完成${NC}"
echo ""

# 完成
echo "========================================="
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "========================================="
echo ""
echo "访问地址："
echo "  🌐 https://43.161.218.176"
echo ""
echo "常用命令："
echo "  查看日志: pm2 logs stock-analysis"
echo "  重启应用: pm2 restart stock-analysis"
echo "  查看状态: pm2 status"
echo ""
echo "⚠️  注意事项："
echo "  1. 请确保已配置数据库连接 (DATABASE_URL)"
echo "  2. 自签名证书会显示安全警告，这是正常的"
echo "  3. 可以使用 Let's Encrypt 替换为正式证书"
echo ""
echo -e "${GREEN}✅ 所有配置完成！${NC}"
