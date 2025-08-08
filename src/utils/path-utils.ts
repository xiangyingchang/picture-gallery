// 路径处理工具函数

/**
 * 获取当前环境的基础路径
 * 在生产环境中返回配置的基础路径，在开发环境中返回空字符串
 */
export function getBasePath(): string {
  // 使用 import.meta.env.BASE_URL 获取 vite.config.ts 中配置的 base 值
  // 这样可以确保与 vite 配置保持一致
  return import.meta.env.BASE_URL.endsWith('/') 
    ? import.meta.env.BASE_URL.slice(0, -1) // 移除末尾的斜杠
    : import.meta.env.BASE_URL;
}

/**
 * 为资源路径添加基础路径前缀
 * @param path 原始资源路径
 * @returns 添加了基础路径前缀的完整路径
 */
export function getAssetPath(path: string): string {
  // 如果路径已经包含了基础路径或是完整的URL，则直接返回
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  
  const basePath = getBasePath();
  
  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${basePath}${normalizedPath}`;
}