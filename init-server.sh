#!/bin/bash

# 股票分析项目 - 腾讯云服务器初始化脚本
# 此脚本会在服务器上创建项目并配置所有必要的文件

set -e  # 遇到错误立即退出

echo "🚀 开始初始化股票分析项目..."

# 1. 创建项目目录
echo "📁 创建项目目录..."
mkdir -p /var/www/stock-analysis
cd /var/www/stock-analysis

# 2. 创建 package.json
echo "📦 创建 package.json..."
cat > package.json << 'EOF'
{
  "name": "stock-analysis",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
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
    "tailwindcss": "^4",
    "typescript": "^5"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "pnpm": ">=9.0.0"
  },
  "pnpm": {
    "overrides": {
      "esbuild": "^0.25.12"
    }
  }
}
EOF

# 3. 创建 next.config.ts
echo "⚙️  创建 Next.js 配置..."
cat > next.config.ts << 'EOF'
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
EOF

# 4. 创建 tsconfig.json
echo "🔧 创建 TypeScript 配置..."
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
      },
      {
        "name": "@react-dev-inspector/plugin",
        "options": {
          "webpackHotServerClientOptions": {
            overlay": false
          }
        }
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

# 5. 创建 .env.local
echo "🔐 创建环境配置文件..."
cat > .env.local << 'EOF'
# 飞书应用配置
FEISHU_APP_ID=cli_a90278570b38dcc7
FEISHU_APP_SECRET=SPcbpXPHXDNKlG1HGgSgFdrdl723PpUs
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/0e1f2e46-0f44-4dff-ac55-c6ffb12ee77f

# 应用访问地址
NEXT_PUBLIC_APP_URL=https://43.161.218.176

# 数据库配置（需要从沙箱复制）
# DATABASE_URL=postgresql://user:password@host:port/database
EOF

# 6. 创建 .coze 配置文件
echo "📝 创建 .coze 配置..."
cat > .coze << 'EOF'
[project]
requires = ["nodejs-24"]

[dev]
build = ["pnpm", "install"]
run = ["pnpm", "run", "dev"]

[deploy]
build = ["bash", "-c", "pnpm install && pnpm run build"]
run = ["pnpm", "run", "start"]
EOF

# 7. 创建 drizzle.config.ts
echo "🗄️  创建 Drizzle 配置..."
cat > drizzle.config.ts << 'EOF'
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default {
  schema: './src/storage/database/shared/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
EOF

# 8. 安装依赖
echo "📥 安装依赖..."
npm install

# 9. 安装 pnpm
echo "🔧 安装 pnpm..."
npm install -g pnpm

# 10. 使用 pnpm 重新安装依赖（确保一致性）
echo "📦 使用 pnpm 安装依赖..."
pnpm install

echo "✅ 基础配置完成！"
echo ""
echo "⚠️  重要提醒："
echo "1. 需要复制沙箱中的 DATABASE_URL 到 .env.local 文件"
echo "2. 需要复制所有源代码文件到服务器"
echo ""
echo "下一步："
echo "1. 从沙箱复制源代码到服务器"
echo "2. 或者：提供 GitHub 仓库地址，使用 git clone"
EOF

chmod +x /var/www/stock-analysis/init.sh
echo "✅ 初始化脚本已创建：/var/www/stock-analysis/init.sh"
