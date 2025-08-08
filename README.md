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

### 后端部署
确保服务器环境支持Node.js，并配置好文件上传目录权限。

## 开发者

由CodeBuddy开发，基于用户需求定制的Instagram风格图片展示应用。

## 许可证

MIT License