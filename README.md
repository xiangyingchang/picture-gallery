# 三三の头像库

一个Instagram风格的图片展示网站，采用现代化的技术栈构建。

## 功能特性

- 📸 **瀑布流图片展示** - 响应式瀑布流布局，完美适配各种设备
- 🔐 **用户认证系统** - 固定管理员账号登录（用户名：三三，密码：sansan）
- 📤 **图片上传管理** - 支持多格式图片上传，批量删除功能
- 🎨 **现代化UI设计** - 基于shadcn/ui的简约美观界面
- 📱 **移动端优化** - 完美支持移动设备访问和操作
- ⚡ **高性能** - 基于Vite构建，快速加载和热更新

## 技术栈

### 前端
- **React 18** - 现代化React框架
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速的构建工具
- **Tailwind CSS** - 实用优先的CSS框架
- **shadcn/ui** - 高质量的UI组件库
- **React Router** - 客户端路由管理

### 后端
- **Node.js** - JavaScript运行时
- **Express** - Web应用框架
- **Multer** - 文件上传中间件

## 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
# 安装前端依赖
npm install

# 安装后端依赖
npm install --prefix . express multer cors
```

### 启动开发服务器
```bash
# 启动前端开发服务器
npm run dev

# 启动后端服务器（新终端窗口）
node server.js
```

### 访问应用
- 前端：http://localhost:5173
- 后端API：http://localhost:3001

## 使用说明

### 浏览图片
- 无需登录即可浏览所有图片
- 支持瀑布流展示和图片详情查看

### 管理功能
1. 点击右上角"登录"按钮
2. 使用管理员账号登录：
   - 用户名：`三三`
   - 密码：`sansan`
3. 登录后可以：
   - 上传新图片
   - 批量删除图片
   - 管理图片库

### 交互操作
- **PC端**：双击图片进入编辑模式
- **移动端**：长按图片进入编辑模式

## 项目结构

```
├── src/
│   ├── components/     # UI组件
│   ├── pages/         # 页面组件
│   ├── context/       # React Context
│   ├── store/         # 状态管理
│   ├── services/      # API服务
│   └── utils/         # 工具函数
├── public/            # 静态资源
├── server.js          # 后端服务器
└── README.md          # 项目说明
```

## 部署说明

### 前端部署
```bash
npm run build
```

生成的静态文件位于 `dist` 目录，可以部署到任何静态文件服务器。

### GitHub Pages 部署

项目已配置 GitHub Actions 工作流，可自动部署到 GitHub Pages：

1. 推送代码到 `main` 分支
2. GitHub Actions 会自动构建并部署到 GitHub Pages
3. 访问 `https://[username].github.io/picture-gallery/` 查看部署结果

### 路径处理机制

项目使用了动态基础路径处理机制，确保在不同环境下资源路径都是正确的：

- 在 `vite.config.ts` 中设置了 `base: '/picture-gallery/'`
- 使用 `path-utils.ts` 中的 `getBasePath()` 和 `getAssetPath()` 函数处理路径
- 在开发环境中，基础路径为空字符串
- 在生产环境中，基础路径为 `/picture-gallery`

这确保了图片和其他资源在本地开发和生产环境中都能正确加载。

### 后端部署

确保服务器环境支持Node.js，并配置好文件上传目录权限。

```bash
# 安装依赖
npm install --prefix . express multer cors

# 启动服务器
node server.js
```

## 开发者注意事项

### 添加新资源

当添加新的静态资源（如图片、字体等）时，请使用 `getAssetPath` 函数处理路径：

```typescript
import { getAssetPath } from "@/utils/path-utils";

// 正确的方式
const imagePath = getAssetPath("/images/example.jpg");

// 错误的方式
const wrongPath = "/images/example.jpg"; // 在生产环境中可能无法正确加载
```

### 路由处理

路由已通过 `BrowserRouter` 的 `basename` 属性处理，无需额外处理。

## 开发者

由CodeBuddy开发，基于用户需求定制的Instagram风格图片展示应用。

## 许可证

MIT License# 触发部署更新 - Sun Aug 10 23:27:27 CST 2025
