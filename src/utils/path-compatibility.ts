/**
 * 路径兼容性处理工具
 * 确保旧的分层路径能正确重定向到新的统一路径
 */

/**
 * 将旧的分层路径转换为新的统一路径
 * @param oldPath 旧路径，如 "uploads/2025/08/image.jpg"
 * @returns 新路径，如 "uploads/image.jpg"
 */
export function convertLegacyPath(oldPath: string): string {
  // 如果已经是新格式，直接返回
  if (!oldPath.includes('/2025/') && !oldPath.includes('/2024/')) {
    return oldPath
  }
  
  // 提取文件名
  const filename = oldPath.split('/').pop()
  if (!filename) {
    return oldPath
  }
  
  // 构建新路径
  const basePath = oldPath.startsWith('public/') ? 'public/uploads' : 'uploads'
  return `${basePath}/${filename}`
}

/**
 * 检查是否为旧格式路径
 * @param path 路径字符串
 * @returns 是否为旧格式
 */
export function isLegacyPath(path: string): boolean {
  return /uploads\/\d{4}\/\d{2}\//.test(path)
}

/**
 * 批量转换路径数组
 * @param paths 路径数组
 * @returns 转换后的路径数组
 */
export function convertLegacyPaths(paths: string[]): string[] {
  return paths.map(convertLegacyPath)
}

/**
 * 图片URL兼容性处理
 * 确保图片URL能正确访问，支持新旧路径格式
 * @param src 图片源路径
 * @returns 兼容的图片URL
 */
export function getCompatibleImageUrl(src: string): string {
  // 如果是外部URL，直接返回
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src
  }
  
  // 如果是旧格式路径，尝试转换
  if (isLegacyPath(src)) {
    const newPath = convertLegacyPath(src)
    console.log(`🔄 路径兼容性转换: ${src} → ${newPath}`)
    return newPath
  }
  
  return src
}

/**
 * 创建路径映射表
 * 用于快速查找旧路径对应的新路径
 */
export class PathMapper {
  private mappings: Map<string, string> = new Map()
  
  /**
   * 添加路径映射
   * @param oldPath 旧路径
   * @param newPath 新路径
   */
  addMapping(oldPath: string, newPath: string): void {
    this.mappings.set(oldPath, newPath)
  }
  
  /**
   * 批量添加映射
   * @param mappings 映射对象
   */
  addMappings(mappings: Record<string, string>): void {
    Object.entries(mappings).forEach(([oldPath, newPath]) => {
      this.addMapping(oldPath, newPath)
    })
  }
  
  /**
   * 获取映射后的路径
   * @param path 原路径
   * @returns 映射后的路径，如果没有映射则返回原路径
   */
  getPath(path: string): string {
    return this.mappings.get(path) || convertLegacyPath(path)
  }
  
  /**
   * 检查是否有映射
   * @param path 路径
   * @returns 是否存在映射
   */
  hasMapping(path: string): boolean {
    return this.mappings.has(path)
  }
  
  /**
   * 清空所有映射
   */
  clear(): void {
    this.mappings.clear()
  }
  
  /**
   * 获取所有映射
   * @returns 映射对象
   */
  getAllMappings(): Record<string, string> {
    const result: Record<string, string> = {}
    this.mappings.forEach((value, key) => {
      result[key] = value
    })
    return result
  }
}

// 全局路径映射器实例
export const globalPathMapper = new PathMapper()

/**
 * 初始化路径映射
 * 根据现有的图片数据创建旧路径到新路径的映射
 */
export function initializePathMappings(images: Array<{ src: string; filename?: string }>) {
  console.log('🔄 初始化路径映射...')
  
  images.forEach(image => {
    if (image.filename && isLegacyPath(image.src)) {
      const newPath = convertLegacyPath(image.src)
      globalPathMapper.addMapping(image.src, newPath)
      console.log(`📍 添加路径映射: ${image.src} → ${newPath}`)
    }
  })
  
  console.log(`✅ 路径映射初始化完成，共 ${Object.keys(globalPathMapper.getAllMappings()).length} 条映射`)
}

/**
 * URL重写中间件
 * 用于处理旧URL的重定向
 */
export function rewriteImageUrl(url: string): string {
  // 检查是否为图片URL
  if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(url)) {
    return url
  }
  
  // 使用全局映射器处理
  const mappedUrl = globalPathMapper.getPath(url)
  
  // 如果路径发生了变化，记录日志
  if (mappedUrl !== url) {
    console.log(`🔄 URL重写: ${url} → ${mappedUrl}`)
  }
  
  return mappedUrl
}

/**
 * 图片加载错误处理
 * 当图片加载失败时，尝试使用兼容路径
 */
export function handleImageLoadError(
  originalSrc: string,
  onRetry: (newSrc: string) => void,
  onFinalError?: () => void
): void {
  console.warn(`⚠️ 图片加载失败: ${originalSrc}`)
  
  // 尝试路径转换
  const compatibleSrc = getCompatibleImageUrl(originalSrc)
  
  if (compatibleSrc !== originalSrc) {
    console.log(`🔄 尝试兼容路径: ${compatibleSrc}`)
    onRetry(compatibleSrc)
  } else {
    console.error(`❌ 无法找到兼容路径: ${originalSrc}`)
    onFinalError?.()
  }
}

/**
 * 路径兼容性检查工具
 */
export class PathCompatibilityChecker {
  private checkedPaths: Set<string> = new Set()
  private failedPaths: Set<string> = new Set()
  
  /**
   * 检查路径是否可访问
   * @param path 路径
   * @returns Promise<boolean> 是否可访问
   */
  async checkPath(path: string): Promise<boolean> {
    if (this.checkedPaths.has(path)) {
      return !this.failedPaths.has(path)
    }
    
    try {
      const response = await fetch(path, { method: 'HEAD' })
      const isAccessible = response.ok
      
      this.checkedPaths.add(path)
      if (!isAccessible) {
        this.failedPaths.add(path)
      }
      
      return isAccessible
    } catch (error) {
      this.checkedPaths.add(path)
      this.failedPaths.add(path)
      return false
    }
  }
  
  /**
   * 批量检查路径
   * @param paths 路径数组
   * @returns Promise<Record<string, boolean>> 检查结果
   */
  async checkPaths(paths: string[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    
    await Promise.all(
      paths.map(async (path) => {
        results[path] = await this.checkPath(path)
      })
    )
    
    return results
  }
  
  /**
   * 获取失败的路径
   * @returns 失败路径数组
   */
  getFailedPaths(): string[] {
    return Array.from(this.failedPaths)
  }
  
  /**
   * 清空检查缓存
   */
  clearCache(): void {
    this.checkedPaths.clear()
    this.failedPaths.clear()
  }
}

// 导出全局检查器实例
export const globalPathChecker = new PathCompatibilityChecker()