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

        // 转换为组件需要的格式
        const dynamicImages: DynamicImageItem[] = metadata.images.map(img => ({
          ...img,
          src: getAssetPath(`/${img.path}`),
          title: img.filename.replace(/\.[^/.]+$/, '') // 移除扩展名作为标题
        }));

        setImages(dynamicImages);
        setTotalCount(metadata.count);
        setLastUpdated(metadata.generated);
        
        return true;
      } else {
        console.log('⚠️ 元数据文件不存在，使用备用方案');
        return false;
      }
    } catch (error) {
      console.log('⚠️ 加载元数据失败，使用备用方案:', error);
      return false;
    }
  }, []);

  // 备用方案：扫描已知的图片目录
  const loadImagesFromDirectory = useCallback(async () => {
    try {
      console.log('🔄 使用备用图片加载方案');
      
      // 这里使用静态的图片列表作为备用
      // 在实际部署中，这个列表会被 GitHub Actions 自动更新
      const staticImages = [
        "4346d1e6d04bf2e4b66a5aeccac4234d.jpg",
        "IMG_4364 (1).JPG",
        "IMG_5008.JPG",
        "IMG_5038.JPG",
        "IMG_5050 (1).JPG",
        "IMG_5070.JPG",
        "IMG_5119.JPG",
        "IMG_5215.JPG",
        "IMG_5459.JPG",
        "IMG_5671.JPG",
        "IMG_5701.jpeg",
        "IMG_5779.JPG",
        "IMG_5825.JPG",
        "IMG_6060.JPG",
        "IMG_6143.JPG",
        "IMG_6181.JPG",
        "IMG_6271.JPG",
        "IMG_6325.JPG",
        "IMG_6394.JPG",
        "IMG_6603.JPG",
        "IMG_6645.JPG",
        "IMG_6666.JPG",
        "IMG_6697.JPG",
        "IMG_0120.JPG",
        "IMG_0485.JPG",
        "IMG_0662.JPG",
        "IMG_0693.JPG",
        "IMG_0695.JPG",
        "IMG_1194.JPG",
        "IMG_1207_2.JPG",
        "IMG_1730.JPG",
        "IMG_2118.JPG",
        "IMG_2267 (1).JPG",
        "IMG_2304.JPG",
        "IMG_2326.JPG",
        "IMG_3824.JPG",
        "IMG_3874.JPG",
        "IMG_3972.JPG",
        "IMG_4112.JPG",
        "IMG_4164.JPG",
        "IMG_4390.JPG",
        "IMG_4495.JPG",
        "IMG_4759.JPG",
        "IMG_4906.JPG",
        "IMG_4925.JPG",
        "IMG_0089.JPG",
        "IMG_0357.JPG",
        "IMG_0362_2.JPG",
        "IMG_0486.JPG",
        "IMG_0561.JPG",
        "IMG_0599.JPG",
        "IMG_0104.JPG",
        "IMG_0162.JPG",
        "IMG_0164.JPG",
        "IMG_0190.JPG",
        "IMG_0221.JPG",
        "IMG_0226.JPG",
        "IMG_0314.JPG",
        "IMG_8410.JPG",
        "IMG_8455.JPG",
        "IMG_8483 (1).JPG",
        "IMG_8581.JPG",
        "IMG_9724.JPG",
        "a89f624fe6feff074da8209b4a2f5ae2.jpg",
        "mmexport1736050148665.jpg",
        "IMG_7246.JPG",
        "IMG_7319.JPG",
        "IMG_7672.JPG",
        "IMG_7886.JPG",
        "IMG_8220.JPG",
        "mmexport1734244006861.jpg",
        "mmexport1735056004829.jpg",
        "mmexport1735362713457.jpg",
        "mmexport1735711028629.jpg",
        "mmexport1735908496461.jpg",
        "mmexport1736780324615.jpg",
        "mmexport1736832843760.jpg",
        "mmexport1736936463344.jpg",
        "IMG_3998.JPG",
        "IMG_5501.JPG",
        "IMG_5769.JPG",
        "IMG_6333.JPG",
        "IMG_6377.JPG",
        "IMG_6441.JPG",
        "IMG_6447.JPG",
        "IMG_6451.JPG",
        "IMG_6506.JPG",
        "IMG_6509.JPG",
        "IMG_6602.JPG",
        "IMG_6638.JPG",
        "IMG_6650.JPG",
        "IMG_6657.JPG",
        "IMG_6683.JPG",
        "IMG_6735.JPG",
        "IMG_6739.JPG",
        "IMG_6756.JPG",
        "IMG_6819.JPG",
        "IMG_6980.JPG",
        "IMG_7087 (1).JPG",
        "IMG_7096.JPG",
        "IMG_7122.JPG",
        "IMG_7154.JPG",
        "a5257b1a907a8919ee4ca02e168958a0.JPG",
        "mmexport1729696189561.png",
        "IMG_2679.JPG",
        "IMG_3911.JPG",
        "IMG_3943.JPG",
        "IMG_3946.JPG",
        "IMG_4013.JPG",
        "IMG_4061.JPG",
        "IMG_4069.JPG",
        "IMG_4107.JPG",
        "IMG_4128.JPG",
        "IMG_5425.JPG",
        "IMG_5514.JPG",
        "7dbe04adb3713da2c78a8e0f3c2663aa.jpg",
        "IMG_2656.JPG",
        "IMG_2957.JPG",
        "IMG_3058.JPG",
        "IMG_3160.JPG",
        "IMG_3213.JPG",
        "IMG_3569.JPG",
        "IMG_3620.JPG",
        "IMG_3636.JPG",
        "IMG_3712.JPG",
        "IMG_3756.JPG",
        "IMG_3811.JPG",
        "IMG_4028.JPG",
        "IMG_4033.JPG",
        "IMG_4040.JPG",
        "IMG_4137.JPG",
        "IMG_5381.JPG",
        "IMG_5422.JPG",
        "IMG_5427.JPG",
        "IMG_1891.JPG",
        "IMG_2002.JPG",
        "IMG_2548.JPG",
        "IMG_2562.JPG",
        "IMG_2974.JPG",
        "IMG_3568.JPG",
        "IMG_3610.JPG",
        "IMG_1537.JPG",
        "IMG_2005.JPG",
        "IMG_5395.JPG",
        "IMG_5439.JPG",
        "IMG_5442.JPG",
        "IMG_5465.JPG",
        "er一下死掉了.jpg"
      ];

      const fallbackImages: DynamicImageItem[] = staticImages.map((filename, index) => {
        const hash = `fallback${index}`;
        const path = `uploads/2025/08/${filename}`;
        
        return {
          id: hash,
          filename,
          path,
          src: getAssetPath(`/${path}`),
          title: filename.replace(/\.[^/.]+$/, ''),
          size: 0, // 未知大小
          created: new Date(Date.now() - 86400000 * index).toISOString(),
          modified: new Date(Date.now() - 86400000 * index).toISOString(),
          hash
        };
      });

      setImages(fallbackImages);
      setTotalCount(fallbackImages.length);
      setLastUpdated(new Date().toISOString());
      
    } catch (error) {
      console.error('❌ 备用方案也失败了:', error);
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

  return {
    images,
    loading,
    error,
    lastUpdated,
    totalCount,
    refreshImages,
    checkForUpdates
  };
}