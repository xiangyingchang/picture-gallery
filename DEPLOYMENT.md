# 图片画廊自动同步系统 - 部署指南

## 🚀 部署概览

本系统采用前后端分离架构：
- **前端**：部署到 GitHub Pages
- **后端**：部署到 Vercel
- **存储**：GitHub 仓库作为图片存储和元数据管理

## 📋 部署前准备

### 1. 环境要求
- Node.js 18+
- Git
- GitHub 账户
- Vercel 账户

### 2. 必需的环境变量

#### 前端 (.env.local)
```bash
VITE_GITHUB_TOKEN=your_github_token
VITE_GITHUB_OWNER=your_username
VITE_GITHUB_REPO=your_repo_name
VITE_ADMIN_PASSWORD_HASH=your_password_hash
VITE_API_BASE_URL=https://your-backend.vercel.app
```

#### 后端 (.env)
```bash
NODE_ENV=production
PORT=3000
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_username
GITHUB_REPO=your_repo_name
CORS_ORIGIN=https://your-username.github.io
```

## 🔧 前端部署到 GitHub Pages

### 1. 自动部署（推荐）

项目已配置 GitHub Actions 自动部署：

```bash
# 提交代码即可触发自动部署
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### 2. 手动部署

```bash
cd insta-masonry-gallery

# 安装依赖
npm install

# 构建项目
npm run build

# 部署到 GitHub Pages
npm run deploy
```

### 3. GitHub Pages 设置

1. 进入 GitHub 仓库设置
2. 找到 "Pages" 选项
3. 选择 "GitHub Actions" 作为部署源
4. 确保 Actions 权限已启用

## 🌐 后端部署到 Vercel

### 1. 使用 Vercel CLI（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 进入后端目录
cd sync-backend

# 登录 Vercel
vercel login

# 部署
vercel --prod
```

### 2. 使用 Vercel 网页界面

1. 访问 [vercel.com](https://vercel.com)
2. 连接 GitHub 仓库
3. 选择 `sync-backend` 目录
4. 配置环境变量
5. 点击部署

### 3. Vercel 配置

项目已包含 `vercel.json` 配置文件：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

## 🔐 安全配置

### 1. GitHub Token 权限

确保 GitHub Token 具有以下权限：
- `repo` - 完整仓库访问权限
- `workflow` - GitHub Actions 权限

### 2. CORS 配置

后端已配置 CORS，确保前端域名在允许列表中：

```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}
```

### 3. 环境变量安全

- 不要在代码中硬编码敏感信息
- 使用 `.env` 文件管理环境变量
- 在部署平台中设置环境变量

## 🌍 域名和 HTTPS 配置

### 1. GitHub Pages 自定义域名

1. 在仓库根目录创建 `CNAME` 文件
2. 添加你的域名（如：`gallery.yourdomain.com`）
3. 在 DNS 提供商处添加 CNAME 记录

### 2. Vercel 自定义域名

1. 在 Vercel 项目设置中添加域名
2. 按照提示配置 DNS 记录
3. Vercel 会自动提供 SSL 证书

### 3. HTTPS 强制

两个平台都默认启用 HTTPS：
- GitHub Pages：自动重定向到 HTTPS
- Vercel：默认启用 SSL/TLS

## 📊 部署验证

### 1. 前端验证

访问你的 GitHub Pages 地址：
```
https://your-username.github.io/picture-gallery/
```

检查项目：
- [ ] 页面正常加载
- [ ] 图片显示正常
- [ ] 上传功能可用
- [ ] 删除功能可用

### 2. 后端验证

访问你的 Vercel API 地址：
```
https://your-backend.vercel.app/api/health
```

检查项目：
- [ ] API 响应正常
- [ ] WebSocket 连接正常
- [ ] GitHub API 集成正常

### 3. 完整功能测试

- [ ] 图片上传到 GitHub
- [ ] 自动生成元数据
- [ ] 实时同步更新
- [ ] 图片删除功能
- [ ] GitHub Actions 触发

## 🔧 故障排除

### 常见问题

1. **GitHub Actions 失败**
   - 检查 Token 权限
   - 验证环境变量配置
   - 查看 Actions 日志

2. **CORS 错误**
   - 确认后端 CORS 配置
   - 检查前端 API 地址

3. **图片上传失败**
   - 验证 GitHub Token
   - 检查仓库权限
   - 确认文件路径正确

4. **WebSocket 连接失败**
   - 检查后端服务状态
   - 验证网络连接
   - 查看浏览器控制台错误

### 日志查看

- **前端**：浏览器开发者工具控制台
- **后端**：Vercel 函数日志
- **GitHub Actions**：Actions 标签页

## 📈 性能优化

### 1. 前端优化

- 启用 Vite 构建优化
- 配置图片懒加载
- 使用 CDN 加速

### 2. 后端优化

- 启用 Vercel Edge Functions
- 配置缓存策略
- 优化 API 响应时间

## 🔄 持续部署

系统已配置自动化部署流程：

1. **代码推送** → GitHub Actions 触发
2. **前端构建** → 部署到 GitHub Pages
3. **后端更新** → Vercel 自动部署
4. **元数据同步** → GitHub Actions 更新

## 📞 技术支持

如遇到部署问题，请检查：
1. 环境变量配置
2. GitHub Token 权限
3. 网络连接状态
4. 服务日志信息

---

🎉 **部署完成后，你将拥有一个完全自动化的图片画廊系统！**