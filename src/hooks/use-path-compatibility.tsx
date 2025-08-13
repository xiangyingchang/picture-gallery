import { useState, useEffect, useCallback } from 'react'
import { 
  getCompatibleImageUrl, 
  handleImageLoadError, 
  globalPathChecker,
  initializePathMappings 
} from '@/utils/path-compatibility'

/**
 * 路径兼容性 Hook
 * 提供图片路径兼容性处理功能
 */
export function usePathCompatibility() {
  const [loadingErrors, setLoadingErrors] = useState<Record<string, boolean>>({})
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>({})

  /**
   * 处理图片加载错误
   */
  const handleImageError = useCallback((originalSrc: string, imgElement: HTMLImageElement) => {
    const currentAttempts = retryAttempts[originalSrc] || 0
    
    // 最多重试2次
    if (currentAttempts < 2) {
      handleImageLoadError(
        originalSrc,
        (newSrc) => {
          console.log(`🔄 重试加载图片: ${newSrc}`)
          imgElement.src = newSrc
          setRetryAttempts(prev => ({
            ...prev,
            [originalSrc]: currentAttempts + 1
          }))
        },
        () => {
          console.error(`❌ 图片加载最终失败: ${originalSrc}`)
          setLoadingErrors(prev => ({
            ...prev,
            [originalSrc]: true
          }))
        }
      )
    } else {
      setLoadingErrors(prev => ({
        ...prev,
        [originalSrc]: true
      }))
    }
  }, [retryAttempts])

  /**
   * 获取兼容的图片URL
   */
  const getCompatibleUrl = useCallback((src: string): string => {
    return getCompatibleImageUrl(src)
  }, [])

  /**
   * 检查图片是否加载失败
   */
  const hasLoadingError = useCallback((src: string): boolean => {
    return loadingErrors[src] || false
  }, [loadingErrors])

  /**
   * 清除加载错误状态
   */
  const clearLoadingError = useCallback((src: string) => {
    setLoadingErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[src]
      return newErrors
    })
    setRetryAttempts(prev => {
      const newAttempts = { ...prev }
      delete newAttempts[src]
      return newAttempts
    })
  }, [])

  /**
   * 批量检查路径可访问性
   */
  const checkPathsAccessibility = useCallback(async (paths: string[]) => {
    return await globalPathChecker.checkPaths(paths)
  }, [])

  return {
    handleImageError,
    getCompatibleUrl,
    hasLoadingError,
    clearLoadingError,
    checkPathsAccessibility
  }
}

/**
 * 图片兼容性组件 Hook
 * 为图片组件提供自动兼容性处理
 */
export function useCompatibleImage(originalSrc: string) {
  const [currentSrc, setCurrentSrc] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const { handleImageError, getCompatibleUrl } = usePathCompatibility()

  useEffect(() => {
    // 初始化时使用兼容URL
    const compatibleSrc = getCompatibleUrl(originalSrc)
    setCurrentSrc(compatibleSrc)
    setIsLoading(true)
    setHasError(false)
  }, [originalSrc, getCompatibleUrl])

  /**
   * 处理图片加载成功
   */
  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
  }, [])

  /**
   * 处理图片加载失败
   */
  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const imgElement = event.currentTarget
    setIsLoading(false)
    
    handleImageError(originalSrc, imgElement)
    setHasError(true)
  }, [originalSrc, handleImageError])

  return {
    src: currentSrc,
    isLoading,
    hasError,
    onLoad: handleLoad,
    onError: handleError
  }
}

/**
 * 路径映射初始化 Hook
 * 用于在应用启动时初始化路径映射
 */
export function usePathMappingInitializer(images: Array<{ src: string; filename?: string }>) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (images.length > 0 && !isInitialized) {
      initializePathMappings(images)
      setIsInitialized(true)
    }
  }, [images, isInitialized])

  return { isInitialized }
}