import { useState, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff, Clock, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useDynamicGallery } from '@/hooks/use-dynamic-gallery';

interface SmartGallerySyncProps {
  onImagesUpdate?: (images: any[]) => void;
  showSyncStatus?: boolean;
  autoRefresh?: boolean;
}

/**
 * 智能图片同步组件
 * 自动检测 GitHub 仓库中的新图片并同步到前端
 */
export function SmartGallerySync({ 
  onImagesUpdate, 
  showSyncStatus = true,
  autoRefresh = true 
}: SmartGallerySyncProps) {
  const {
    images,
    loading,
    error,
    lastUpdated,
    totalCount,
    refreshImages,
    checkForUpdates
  } = useDynamicGallery();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [newImagesCount, setNewImagesCount] = useState(0);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 当图片更新时通知父组件
  useEffect(() => {
    if (onImagesUpdate && images.length > 0) {
      onImagesUpdate(images);
    }
  }, [images, onImagesUpdate]);

  // 自动刷新逻辑
  useEffect(() => {
    if (!autoRefresh || !isOnline) return;

    const interval = setInterval(async () => {
      const hasUpdates = await checkForUpdates();
      setLastCheckTime(new Date());
      
      if (hasUpdates) {
        setNewImagesCount(prev => prev + 1);
      }
    }, 2 * 60 * 1000); // 每2分钟检查一次

    return () => clearInterval(interval);
  }, [autoRefresh, isOnline, checkForUpdates]);

  // 手动刷新
  const handleManualRefresh = async () => {
    setLastCheckTime(new Date());
    await refreshImages();
    setNewImagesCount(0);
  };

  // 格式化时间
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '未知';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
    return `${Math.floor(diffMins / 1440)}天前`;
  };

  if (!showSyncStatus) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* 网络状态指示器 */}
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {isOnline ? '在线' : '离线'}
              </span>
            </div>

            {/* 图片统计 */}
            <div className="flex items-center space-x-2">
              <Image className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">
                {totalCount} 张图片
              </span>
            </div>

            {/* 新图片提示 */}
            {newImagesCount > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {newImagesCount} 张新图片
              </Badge>
            )}

            {/* 加载状态 */}
            {loading && (
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-muted-foreground">同步中...</span>
              </div>
            )}

            {/* 错误状态 */}
            {error && (
              <Badge variant="destructive" className="text-xs">
                同步失败
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* 最后更新时间 */}
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                更新: {formatTime(lastUpdated)}
              </span>
            </div>

            {/* 最后检查时间 */}
            {lastCheckTime && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <span>
                  检查: {formatTime(lastCheckTime.toISOString())}
                </span>
              </div>
            )}

            {/* 手动刷新按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={loading || !isOnline}
              className="h-8"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </div>

        {/* 详细状态信息 */}
        {(error || newImagesCount > 0) && (
          <div className="mt-3 pt-3 border-t">
            {error && (
              <div className="text-sm text-red-600 mb-2">
                ⚠️ {error}
              </div>
            )}
            
            {newImagesCount > 0 && (
              <div className="text-sm text-green-600">
                🎉 检测到 {newImagesCount} 张新图片！点击刷新按钮查看最新内容。
              </div>
            )}
          </div>
        )}

        {/* 自动同步说明 */}
        {autoRefresh && (
          <div className="mt-2 text-xs text-muted-foreground">
            💡 系统每2分钟自动检查新图片，页面获得焦点时也会自动检查
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SmartGallerySync;