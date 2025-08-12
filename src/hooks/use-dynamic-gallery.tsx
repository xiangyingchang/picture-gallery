import { useState, useEffect, useCallback } from 'react';
import { getAssetPath } from '@/utils/path-utils';

export interface DynamicImageItem {
  id: string;
  filename: string;
  path: string;
  src: string;
  title: string;
  size: number;
  created: string;
  modified: string;
  hash: string;
}

interface GalleryMetadata {
  generated: string;
  count: number;
  images: DynamicImageItem[];
}

/**
 * 动态图片库 Hook
 * 自动从 GitHub Pages 加载最新的图片元数据
 */
export function useDynamicGallery() {
  const [images, setImages] = useState<DynamicImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // 从元数据文件加载图片信息
  const loadImagesFromMetadata = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 尝试从元数据文件加载
      const metadataUrl = getAssetPath('/gallery-metadata.json');
      console.log('🔍 尝试加载图片元数据:', metadataUrl);

      // 添加时间戳参数强制刷新缓存
      const timestamp = Date.now();
      const response = await fetch(`${metadataUrl}?t=${timestamp}`, {
        cache: 'no-cache', // 确保获取最新数据
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (response.ok) {
        const metadata: GalleryMetadata = await response.json();
        console.log('✅ 成功加载元数据:', metadata.count, '张图片');
        console.log('📅 元数据生成时间:', metadata.generated);

        // 获取本地删除记录
        const deletedImages = JSON.parse(localStorage.getItem('deletedImages') || '[]')
        console.log('🗑️ 本地删除记录:', deletedImages)
        
        // 转换为组件需要的格式，并过滤掉已删除的图片
        const dynamicImages: DynamicImageItem[] = metadata.images
          .filter(img => !deletedImages.includes(img.id))
          .map(img => ({
            ...img,
            src: getAssetPath(`/${img.path}`),
            title: img.filename.replace(/\.[^/.]+$/, '') // 移除扩展名作为标题
          }));

        console.log(`📋 过滤后的图片数量: ${dynamicImages.length}/${metadata.images.length}`)
        setImages(dynamicImages);
        setTotalCount(metadata.count);
        setLastUpdated(metadata.generated);
        
        return true;
      } else {
        console.log('⚠️ 元数据文件不存在，状态码:', response.status);
        return false;
      }
    } catch (error) {
      console.log('⚠️ 加载元数据失败:', error);
      return false;
    }
  }, []);

  // 备用方案：显示空列表并提示用户
  const loadImagesFromDirectory = useCallback(async () => {
    try {
      console.log('⚠️ 元数据文件不可用，显示空图片列表');
      console.log('💡 请确保 GitHub Actions 已正确配置并运行');
      
      // 不再使用静态列表，而是显示空列表
      setImages([]);
      setTotalCount(0);
      setLastUpdated(new Date().toISOString());
      setError('无法加载图片元数据，请检查网络连接或稍后重试');
      
    } catch (error) {
      console.error('❌ 备用方案失败:', error);
      setError('无法加载图片');
    }
  }, []);

  // 主加载函数
  const loadImages = useCallback(async () => {
    const metadataLoaded = await loadImagesFromMetadata();
    
    if (!metadataLoaded) {
      await loadImagesFromDirectory();
    }
    
    setLoading(false);
  }, [loadImagesFromMetadata, loadImagesFromDirectory]);

  // 刷新图片列表
  const refreshImages = useCallback(async () => {
    console.log('🔄 手动刷新图片列表');
    await loadImages();
  }, [loadImages]);

  // 检查是否有新图片
  const checkForUpdates = useCallback(async () => {
    try {
      const metadataUrl = getAssetPath('/gallery-metadata.json');
      const response = await fetch(metadataUrl, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const metadata: GalleryMetadata = await response.json();
        
        // 检查是否有更新
        if (lastUpdated && metadata.generated !== lastUpdated) {
          console.log('🆕 检测到新图片，自动刷新');
          await loadImages();
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.log('检查更新失败:', error);
      return false;
    }
  }, [lastUpdated, loadImages]);

  // 初始加载
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // 定期检查更新（每5分钟）
  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpdates();
    }, 5 * 60 * 1000); // 5分钟

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  // 页面获得焦点时检查更新
  useEffect(() => {
    const handleFocus = () => {
      checkForUpdates();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkForUpdates]);

  // 从本地缓存中移除指定的图片
  const removeImagesFromCache = useCallback((imageIds: string[]) => {
    console.log('🗑️ 从本地缓存中移除图片:', imageIds);
    setImages(prev => prev.filter(img => !imageIds.includes(img.id)));
    setTotalCount(prev => Math.max(0, prev - imageIds.length));
  }, []);

  // 清理本地删除记录（当元数据更新后调用）
  const cleanupDeletedRecords = useCallback(() => {
    const deletedImages = JSON.parse(localStorage.getItem('deletedImages') || '[]');
    if (deletedImages.length > 0) {
      console.log('🧹 清理本地删除记录:', deletedImages.length, '条');
      localStorage.removeItem('deletedImages');
    }
  }, []);

  // 检测元数据更新并清理删除记录
  useEffect(() => {
    if (lastUpdated && images.length > 0) {
      // 如果元数据已更新且有图片数据，说明GitHub Actions已完成
      // 延迟清理删除记录，确保数据已同步
      const timer = setTimeout(() => {
        cleanupDeletedRecords();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [lastUpdated, images.length, cleanupDeletedRecords]);

  return {
    images,
    loading,
    error,
    lastUpdated,
    totalCount,
    refreshImages,
    checkForUpdates,
    removeImagesFromCache
  };
}