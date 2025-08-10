# 三三の头像库 🎨

一个Instagram风格的现代化图片展示网站，采用企业级安全标准构建。

## ✨ 功能特性

- 📸 **瀑布流图片展示** - 响应式瀑布流布局，完美适配各种设备
- 🔐 **企业级安全认证** - 密码哈希化存储，AES数据加密，安全会话管理
- 📤 **智能图片管理** - 支持GitHub直传，多格式上传，批量操作
- 🎨 **现代化UI设计** - 基于shadcn/ui的简约美观界面
- 📱 **移动端优化** - 完美支持移动设备访问和操作
- ⚡ **高性能架构** - 基于Vite构建，快速加载和热更新
- 🤖 **自动化部署** - GitHub Actions自动构建和部署
- 🛡️ **隐私保护** - 敏感信息加密存储，无明文泄露风险

## 🔒 安全特性

### 认证安全
- ✅ **密码哈希化**: SHA256 + 盐值加密存储
- ✅ **安全会话**: 24小时自动过期机制
- ✅ **环境变量**: 生产环境安全配置

### 数据加密
- ✅ **AES-256加密**: GitHub配置信息军用级加密
- ✅ **本地存储加密**: 敏感数据加密存储
- ✅ **密钥管理**: 自定义加密密钥支持

## 🚀 技术栈

### 前端
- **React 18** - 现代化React框架
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速的构建工具
- **Tailwind CSS** - 实用优先的CSS框架
- **shadcn/ui** - 高质量的UI组件库
- **React Router** - 客户端路由管理
- **crypto-js** - 加密工具库

### 后端集成
- **GitHub API** - 图片存储和管理
- **Node.js Scripts** - 自动化脚本
- **GitHub Actions** - CI/CD自动化

## 📦 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn
- GitHub账号（用于图片存储）

### 1. 克隆项目
```bash
git clone https://github.com/xiangyingchang/picture-gallery.git
cd picture-gallery
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置您的安全凭据
nano .env
```

### 4. 安全配置

#### 设置管理员凭据
```bash
# 生成密码哈希（示例）
VITE_ADMIN_USERNAME=your_username
VITE_ADMIN_PASSWORD_HASH=your_password_hash

# 设置加密密钥
VITE_ENCRYPTION_KEY=your_custom_encryption_key_2024
```

#### GitHub配置（可选）
```bash
VITE_GITHUB_OWNER=your_github_username
VITE_GITHUB_REPO=your_repo_name
VITE_GITHUB_TOKEN=your_github_token
VITE_GITHUB_BRANCH=main
```

### 5. 启动开发服务器
```bash
npm run dev
```

### 6. 访问应用
- 开发环境：http://localhost:5173
- 生产环境：https://your-username.github.io/picture-gallery/

## 🔧 使用说明

### 浏览图片
- 无需登录即可浏览所有图片
- 支持瀑布流展示和图片详情查看
- 响应式设计，完美适配各种设备

### 管理功能
1. 点击右上角"登录"按钮
2. 使用您配置的管理员账号登录
3. 登录后可以：
   - 📤 上传新图片到GitHub
   - 🗑️ 批量删除图片
   - ⚙️ 配置GitHub存储设置
   - 📊 查看图片统计信息

### 交互操作
- **PC端**：双击图片进入编辑模式
- **移动端**：长按图片进入编辑模式
- **键盘导航**：支持方向键浏览

## 📁 项目结构

```
├── src/
│   ├── components/        # UI组件
│   │   ├── ui/           # shadcn/ui组件
│   │   ├── masonry-grid.tsx
│   │   ├── github-config.tsx
│   │   └── ...
│   ├── pages/            # 页面组件
│   │   ├── gallery-page.tsx
│   │   ├── upload-page.tsx
│   │   ├── login-page.tsx
│   │   └── ...
│   ├── context/          # React Context
│   │   └── auth-context.tsx
│   ├── utils/            # 工具函数
│   │   ├── auth-utils.ts     # 认证工具
│   │   ├── crypto-utils.ts   # 加密工具
│   │   └── ...
│   ├── services/         # API服务
│   │   ├── github-api.ts
│   │   └── api.ts
│   └── store/           # 状态管理
├── public/              # 静态资源
├── docs/               # 文档
│   ├── security-guide.md
│   └── automation-guide.md
├── .github/workflows/  # GitHub Actions
├── scripts/           # 自动化脚本
└── README.md         # 项目说明
```

## 🚀 部署说明

### 自动部署（推荐）
项目已配置GitHub Actions自动部署：

1. **推送代码**到main分支
2. **GitHub Actions**自动构建和部署
3. **访问**部署的网站

### 手动部署
```bash
# 构建生产版本
npm run build

# 部署到GitHub Pages
npm run deploy
```

### 环境变量配置
在部署平台（Vercel、Netlify等）设置环境变量：

```bash
VITE_ADMIN_USERNAME=your_username
VITE_ADMIN_PASSWORD_HASH=your_password_hash
VITE_ENCRYPTION_KEY=your_encryption_key
VITE_GITHUB_OWNER=your_github_username
VITE_GITHUB_REPO=your_repo_name
VITE_GITHUB_TOKEN=your_github_token
VITE_GITHUB_BRANCH=main
```

## 🛡️ 安全指南

### 密码安全
1. **使用强密码**：至少12位，包含大小写字母、数字和特殊字符
2. **定期更换**：建议每3-6个月更换一次密码
3. **哈希存储**：系统自动使用SHA256+盐值加密存储

### GitHub Token安全
1. **最小权限**：只授予必要的仓库权限
2. **定期轮换**：建议每6个月更换一次Token
3. **加密存储**：系统使用AES-256加密存储

### 环境变量安全
1. **不要提交**：.env文件已在.gitignore中
2. **生产环境**：在部署平台单独配置
3. **访问控制**：限制环境变量访问权限

## 🔄 更新日志

### v2.0.0 (2024-08-11) - 安全大升级
- 🔒 实现企业级安全认证系统
- 🛡️ 添加AES-256数据加密
- 🔐 密码哈希化存储
- 📝 完善安全文档和配置指南
- 🧹 清理敏感文件和调试代码

### v1.5.0 - GitHub集成
- 📤 GitHub直传功能
- 🤖 自动化部署流程
- 📊 智能图片管理

### v1.0.0 - 基础功能
- 📸 瀑布流图片展示
- 🔐 基础认证系统
- 📱 响应式设计

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 👨‍💻 开发者

由CodeBuddy开发，基于用户需求定制的现代化图片展示应用。

## 📞 支持

如有问题或建议，请：
- 📧 提交Issue
- 💬 参与Discussions
- 🌟 给项目点个Star

---

**享受您的个人图片画廊！** 🎨📸✨

*最后更新：2024年8月11日*