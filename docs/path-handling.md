# 路径处理机制文档

## 问题背景

在将项目部署到 GitHub Pages 后，发现图片无法正常显示。经过分析，问题出在资源路径的处理上：

1. 在 `vite.config.ts` 中设置了 `base: '/picture-gallery/'`，这意味着所有资源路径在生产环境中都应该以 `/picture-gallery/` 开头
2. 但在代码中，图片路径都是以 `/` 开头的绝对路径，如 `/placeholder.svg` 和 `/uploads/...`
3. 在本地开发时这些路径工作正常，但部署到 GitHub Pages 后，浏览器会尝试从错误的路径加载图片

## 解决方案

### 1. 路径工具函数

创建了 `src/utils/path-utils.ts` 文件，提供两个核心函数：

```typescript
/**
 * 获取当前环境的基础路径
 */
export function getBasePath(): string {
  return import.meta.env.BASE_URL.endsWith('/') 
    ? import.meta.env.BASE_URL.slice(0, -1) 
    : import.meta.env.BASE_URL;
}

/**
 * 为资源路径添加基础路径前缀
 */
export function getAssetPath(path: string): string {
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  
  const basePath = getBasePath();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${basePath}${normalizedPath}`;
}
```

### 2. 路由处理

修改了 `main.tsx` 中的 `BrowserRouter` 配置：

```tsx
<BrowserRouter basename={getBasePath()}>
  <App />
  <Toaster />
</BrowserRouter>
```

### 3. 图片路径处理

在以下文件中使用 `getAssetPath()` 函数处理图片路径：

- `gallery-store.tsx`：处理初始图片和从服务器获取的图片
- `image-utils.ts`：处理预览图片路径
- `image-card.tsx`：处理图片显示
- `image-detail-page.tsx`：处理图片详情页
- `upload-page.tsx`：处理上传图片预览

### 4. 服务器端路径处理

服务器端生成的图片路径（如 `/uploads/2025/08/image.jpg`）会在前端通过 `getAssetPath` 函数处理，确保在不同环境下图片路径都是正确的。

## 工作原理

1. **动态基础路径**：
   - 在开发环境中，`getBasePath()` 返回空字符串
   - 在生产环境中，`getBasePath()` 返回 `/picture-gallery`

2. **路径转换**：
   - `getAssetPath()` 函数为资源路径添加基础路径前缀
   - 例如，`/placeholder.svg` 在生产环境中会变成 `/picture-gallery/placeholder.svg`

3. **路由处理**：
   - 通过设置 `BrowserRouter` 的 `basename` 属性，确保路由在部署后能正确工作
   - 这样，所有的路由路径也会自动添加基础路径前缀

## 最佳实践

1. **添加新资源**：
   - 始终使用 `getAssetPath()` 函数处理静态资源路径
   - 不要直接使用以 `/` 开头的绝对路径

2. **路由导航**：
   - 使用 `useNavigate()` 钩子进行路由导航，无需手动添加基础路径
   - 例如：`navigate('/gallery')` 而不是 `navigate('/picture-gallery/gallery')`

3. **API 请求**：
   - API 请求路径不需要使用 `getAssetPath()` 处理，因为它们通过代理配置处理
   - 例如：`fetch('/api/images')` 而不是 `fetch(getAssetPath('/api/images'))`

## 测试

部署后，请测试以下功能，确保图片正常显示：

1. 首页图片瀑布流
2. 图片详情页
3. 上传图片预览
4. 上传后的图片显示

## 注意事项

如果将来需要更改基础路径（例如，从 `/picture-gallery/` 更改为其他路径），只需更新 `vite.config.ts` 中的 `base` 配置，无需修改代码中的路径处理逻辑。