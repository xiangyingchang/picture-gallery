# 🤖 图片库自动化管理系统

## 📋 概述

这是一个完整的自动化解决方案，用于管理 Instagram 风格图片画廊的图片更新流程。当新图片添加到指定目录时，系统会自动更新代码并触发部署。

## 🏗️ 系统架构

```
📁 项目结构
├── scripts/
│   ├── update-gallery.js      # 核心更新脚本
│   ├── watch-images.js        # 文件监听器
│   └── package.json           # 脚本依赖配置
├── .github/workflows/
│   └── auto-update-gallery.yml # GitHub Actions 自动化流程
├── public/uploads/2025/08/     # 图片存储目录
├── src/store/gallery-store.tsx # 图片数据存储
└── logs/                       # 日志文件目录
```

## 🚀 功能特性

### ✅ 核心功能
- **自动扫描**: 监听 `public/uploads/2025/08` 目录变化
- **格式验证**: 支持 JPG、JPEG、PNG、WEBP 格式
- **代码更新**: 自动更新 `gallery-store.tsx` 中的图片列表
- **语法验证**: 确保更新后的代码语法正确
- **日志记录**: 详细记录处理过程和状态
- **自动部署**: 通过 GitHub Actions 自动部署到 GitHub Pages

### 🔧 高级功能
- **防抖处理**: 避免频繁触发更新
- **文件备份**: 更新前自动备份原文件
- **错误恢复**: 更新失败时可回滚到备份版本
- **批量处理**: 一次性处理多个新增图片
- **Git 集成**: 可选的自动提交和推送功能

## 📖 使用方法

### 方法 1: 手动执行脚本

```bash
# 进入项目目录
cd insta-masonry-gallery/insta-masonry-gallery

# 安装依赖
npm install chokidar --save-dev

# 执行一次性更新
node scripts/update-gallery.js

# 启动文件监听器（仅监听，不自动提交）
node scripts/watch-images.js

# 启动文件监听器（自动提交，不推送）
AUTO_COMMIT=true node scripts/watch-images.js

# 启动文件监听器（自动提交并推送）
AUTO_COMMIT=true AUTO_PUSH=true node scripts/watch-images.js
```

### 方法 2: 使用 npm 脚本

```bash
# 更新主项目的 package.json
npm install chokidar --save-dev

# 添加以下脚本到 package.json
{
  "scripts": {
    "gallery:update": "node scripts/update-gallery.js",
    "gallery:watch": "node scripts/watch-images.js",
    "gallery:watch-auto": "AUTO_COMMIT=true node scripts/watch-images.js"
  }
}

# 执行脚本
npm run gallery:update      # 一次性更新
npm run gallery:watch       # 启动监听器
npm run gallery:watch-auto  # 启动监听器（自动提交）
```

### 方法 3: GitHub Actions 自动化

当你推送包含新图片的提交到 GitHub 时，系统会自动：

1. 检测 `public/uploads/**` 路径下的文件变化
2. 扫描图片目录并验证格式
3. 更新 `gallery-store.tsx` 文件
4. 自动提交更改
5. 构建并部署到 GitHub Pages

## 📝 添加新图片的步骤

### 步骤 1: 添加图片文件
```bash
# 将新图片复制到指定目录
cp /path/to/new-image.jpg public/uploads/2025/08/
```

### 步骤 2: 选择处理方式

#### 选项 A: 自动处理（推荐）
```bash
# 启动监听器，自动检测并处理
npm run gallery:watch-auto
```

#### 选项 B: 手动处理
```bash
# 手动执行更新
npm run gallery:update

# 提交更改
git add .
git commit -m "feat: 添加新图片到画廊"
git push origin main
```

#### 选项 C: 直接推送（GitHub Actions 处理）
```bash
# 直接提交并推送，让 GitHub Actions 处理
git add public/uploads/2025/08/
git commit -m "feat: 添加新图片"
git push origin main
```

## 🔍 日志和监控

### 日志文件位置
- `logs/gallery-update.log` - 更新脚本日志
- `logs/watcher.log` - 文件监听器日志
- `logs/gallery-report.json` - 处理报告（JSON 格式）

### 日志示例
```
[2025-01-10T14:30:00.000Z] [INFO] === 开始图片库自动更新流程 ===
[2025-01-10T14:30:00.100Z] [INFO] 开始扫描图片目录...
[2025-01-10T14:30:00.200Z] [INFO] 发现有效图片: IMG_0001.JPG (1024.50 KB)
[2025-01-10T14:30:00.300Z] [INFO] 扫描完成，发现 125 张有效图片
[2025-01-10T14:30:00.400Z] [INFO] 开始更新 gallery-store.tsx 文件...
[2025-01-10T14:30:00.500Z] [INFO] 已创建备份文件: gallery-store.tsx.backup.1704902200500
[2025-01-10T14:30:00.600Z] [INFO] 成功更新 gallery-store.tsx，包含 125 张图片
[2025-01-10T14:30:00.700Z] [INFO] === 图片库自动更新流程完成 ===
```

## ⚙️ 配置选项

### 环境变量
- `AUTO_COMMIT=true` - 启用自动 Git 提交
- `AUTO_PUSH=true` - 启用自动 Git 推送
- `DEBOUNCE_DELAY=2000` - 防抖延迟时间（毫秒）

### 脚本配置
在 `scripts/update-gallery.js` 中可以修改：
- `SUPPORTED_FORMATS` - 支持的图片格式
- `IMAGES_DIR` - 图片目录路径
- `GALLERY_STORE_PATH` - 目标文件路径

## 🛠️ 故障排除

### 常见问题

#### 1. 脚本执行失败
```bash
# 检查 Node.js 版本
node --version  # 需要 >= 14.0.0

# 检查依赖安装
npm list chokidar

# 重新安装依赖
npm install chokidar --save-dev
```

#### 2. 图片未被检测到
```bash
# 检查图片目录是否存在
ls -la public/uploads/2025/08/

# 检查图片格式是否支持
file public/uploads/2025/08/your-image.jpg

# 手动执行扫描
node scripts/update-gallery.js
```

#### 3. Git 提交失败
```bash
# 检查 Git 配置
git config --list

# 设置用户信息
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 检查文件权限
ls -la src/store/gallery-store.tsx
```

#### 4. GitHub Actions 失败
- 检查 GitHub 仓库的 Actions 权限设置
- 确保 `GITHUB_TOKEN` 有足够的权限
- 查看 Actions 日志获取详细错误信息

### 恢复备份
如果更新出现问题，可以恢复备份：
```bash
# 查找备份文件
ls -la src/store/gallery-store.tsx.backup.*

# 恢复最新备份
cp src/store/gallery-store.tsx.backup.1704902200500 src/store/gallery-store.tsx
```

## 🔒 安全考虑

1. **文件权限**: 确保脚本只能访问指定目录
2. **格式验证**: 严格验证上传文件格式
3. **大小限制**: 建议单个文件不超过 10MB
4. **备份机制**: 自动备份重要文件
5. **日志审计**: 记录所有操作用于审计

## 📈 性能优化

1. **防抖处理**: 避免频繁触发更新
2. **批量处理**: 一次处理多个文件变化
3. **增量更新**: 只更新变化的部分
4. **缓存机制**: 缓存文件扫描结果
5. **异步处理**: 使用异步操作提高性能

## 🔄 版本更新

当需要更新自动化脚本时：

1. 备份当前脚本
2. 更新脚本文件
3. 测试新功能
4. 更新文档
5. 提交更改

## 📞 技术支持

如果遇到问题，请：

1. 查看日志文件获取详细信息
2. 检查 GitHub Actions 运行状态
3. 验证文件权限和路径配置
4. 确认依赖安装正确

---

**部署 URL**: https://xiangyingchang.github.io/picture-gallery/

**最后更新**: 2025-01-10