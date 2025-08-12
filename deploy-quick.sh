#!/bin/bash

echo "🚀 快速部署图片画廊系统..."

# 检查当前目录
if [ ! -d "insta-masonry-gallery" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

echo "📦 1. 前端已构建完成 ✅"

echo "🌐 2. 检查GitHub Pages部署状态..."
echo "   访问: https://github.com/muskxiang/Picture/actions"
echo "   确认GitHub Actions正在运行"

echo "🔧 3. 后端部署到Vercel..."
echo "   请按照以下步骤操作："
echo "   1) 安装Vercel CLI: npm i -g vercel"
echo "   2) 登录Vercel: vercel login"
echo "   3) 进入后端目录: cd sync-backend"
echo "   4) 部署: vercel --prod"

echo ""
echo "📋 4. 环境变量配置检查清单："
echo "   前端 (.env.local):"
echo "   ✓ VITE_GITHUB_TOKEN"
echo "   ✓ VITE_GITHUB_OWNER"
echo "   ✓ VITE_GITHUB_REPO"
echo "   ✓ VITE_ADMIN_PASSWORD_HASH"
echo ""
echo "   后端 (Vercel环境变量):"
echo "   ✓ GITHUB_TOKEN"
echo "   ✓ GITHUB_OWNER"
echo "   ✓ GITHUB_REPO"
echo "   ✓ FRONTEND_URL"

echo ""
echo "🔗 5. 部署完成后的访问地址："
echo "   前端: https://muskxiang.github.io/picture-gallery/"
echo "   后端: https://your-backend.vercel.app"

echo ""
echo "✅ 部署准备完成！请按照上述步骤完成Vercel部署。"