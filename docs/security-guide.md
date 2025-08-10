# 🔒 安全配置指南

## 隐私保护措施

### 1. 登录凭据安全
- ✅ **密码哈希化**：密码使用 SHA256 + 盐值进行哈希处理
- ✅ **环境变量**：敏感信息通过环境变量配置
- ✅ **会话管理**：使用安全的会话令牌，24小时自动过期

### 2. GitHub配置安全
- ✅ **AES加密**：GitHub Token 使用 AES 算法加密存储
- ✅ **本地存储**：敏感数据仅存储在用户本地，不会上传到服务器
- ✅ **环境变量支持**：支持通过环境变量预配置

## 配置步骤

### 步骤1：设置环境变量
1. 复制 `.env.example` 为 `.env`
2. 修改以下配置：

```bash
# 修改管理员用户名
VITE_ADMIN_USERNAME=your_username

# 生成新的密码哈希（推荐）
VITE_ADMIN_PASSWORD_HASH=your_password_hash

# 设置自定义加密密钥（必须修改）
VITE_ENCRYPTION_KEY=your_custom_encryption_key_2024
```

### 步骤2：生成密码哈希
使用以下JavaScript代码生成密码哈希：

```javascript
import CryptoJS from 'crypto-js'

function hashPassword(password) {
  return CryptoJS.SHA256(password + 'gallery_salt_2024').toString()
}

// 示例：为密码 "mypassword" 生成哈希
console.log(hashPassword('mypassword'))
```

### 步骤3：GitHub Token配置
1. 访问 GitHub → Settings → Developer settings → Personal access tokens
2. 创建新的 Classic Token
3. 选择 `repo` 权限（完整仓库访问）
4. 在应用中配置或通过环境变量设置

## 安全特性

### 数据加密
- **算法**：AES-256 加密
- **存储**：仅本地加密存储，不传输到服务器
- **密钥**：通过环境变量配置，不硬编码

### 会话管理
- **令牌生成**：使用时间戳 + 随机数 + SHA256
- **自动过期**：24小时后自动失效
- **安全验证**：每次访问都验证令牌有效性

### 隐私保护
- **本地存储**：所有敏感数据仅存储在用户浏览器本地
- **加密传输**：GitHub API 使用 HTTPS 加密传输
- **无服务器依赖**：不依赖后端服务器存储敏感信息

## 部署注意事项

### 生产环境
1. **必须修改**默认的加密密钥
2. **必须修改**默认的用户名和密码
3. **不要提交** `.env` 文件到Git仓库
4. **定期更换** GitHub Personal Access Token

### 环境变量设置
在部署平台（如Vercel、Netlify）设置环境变量：

```
VITE_ADMIN_USERNAME=your_username
VITE_ADMIN_PASSWORD_HASH=your_password_hash
VITE_ENCRYPTION_KEY=your_encryption_key
```

## 常见问题

### Q: 忘记密码怎么办？
A: 重新生成密码哈希并更新环境变量中的 `VITE_ADMIN_PASSWORD_HASH`

### Q: GitHub Token 泄露了怎么办？
A: 立即在GitHub中撤销该Token，生成新的Token并更新配置

### Q: 如何更换加密密钥？
A: 更新 `VITE_ENCRYPTION_KEY` 后，需要重新配置GitHub设置（旧的加密数据无法解密）

## 安全检查清单

- [ ] 已修改默认用户名和密码
- [ ] 已设置自定义加密密钥
- [ ] `.env` 文件已添加到 `.gitignore`
- [ ] GitHub Token 权限最小化（仅repo权限）
- [ ] 定期更换GitHub Token
- [ ] 生产环境使用环境变量配置