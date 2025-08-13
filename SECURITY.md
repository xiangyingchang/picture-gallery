# 🔐 安全配置指南

## ⚠️ 重要安全提醒

**当前配置存在安全风险**：GitHub Token 通过环境变量暴露在前端代码中，任何人都可以通过浏览器开发者工具查看到。

## 🛡️ 推荐的安全方案

### 方案一：仅本地开发使用（推荐）
```bash
# 1. 从 .env 中移除 GitHub 配置
# 2. 仅在本地开发时手动配置 GitHub Token
# 3. 生产环境使用 GitHub Actions 自动同步
```

### 方案二：服务端代理（最安全）
```bash
# 1. 创建后端 API 服务
# 2. GitHub Token 存储在服务端
# 3. 前端通过 API 调用上传功能
```

### 方案三：GitHub Actions 工作流（推荐）
```bash
# 1. 使用 GitHub Actions 的 GITHUB_TOKEN
# 2. 通过 workflow_dispatch 触发上传
# 3. 前端仅负责展示，不直接操作仓库
```

## 🔧 立即安全措施

### 1. 撤销当前 Token
```bash
# 访问 GitHub → Settings → Developer settings → Personal access tokens
# 找到当前 token 并删除它
```

### 2. 创建新的受限 Token
```bash
# 创建新 token 时，仅授予必要权限：
# - Contents: Write (用于上传文件)
# - Metadata: Read (用于读取仓库信息)
# - Actions: Write (用于触发工作流，可选)
```

### 3. 使用 GitHub Secrets
```bash
# 在 GitHub 仓库设置中添加 Secrets：
# GITHUB_TOKEN: 你的新 token
# 在 GitHub Actions 中使用，不暴露给前端
```

## 🚨 当前风险评估

- **风险等级**：🔴 高风险
- **暴露内容**：完整的 GitHub Personal Access Token
- **潜在影响**：攻击者可以完全控制你的仓库
- **建议行动**：立即撤销当前 token 并重新配置

## 📋 安全检查清单

- [ ] 撤销当前暴露的 GitHub Token
- [ ] 从 .env 中移除敏感信息
- [ ] 创建新的受限权限 Token
- [ ] 实施服务端代理或使用 GitHub Actions
- [ ] 定期轮换 Token
- [ ] 监控仓库访问日志

## 🔄 推荐的工作流

1. **开发阶段**：本地手动配置 GitHub Token
2. **部署阶段**：使用 GitHub Actions 自动同步
3. **生产环境**：前端仅展示，不直接操作 GitHub API

---

**记住：永远不要将敏感信息（如 API Keys、Tokens）暴露在前端代码中！**