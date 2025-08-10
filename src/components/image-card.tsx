import React from "react"
import { useNavigate } from "react-router-dom"
import type { ImageItem } from "@/store/gallery-store"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { getAssetPath } from "@/utils/path-utils"

type Props = {
  item: ImageItem
  onClick?: () => void
  className?: string
  isEditMode?: boolean
  isSelected?: boolean
  onSelect?: (id: string) => void
  onEnterEditMode?: () => void
}

export default function ImageCard({ 
  item, 
  onClick, 
  className, 
  isEditMode = false, 
  isSelected = false, 
  onSelect,
  onEnterEditMode
}: Props) {
  const nav = useNavigate()
  const [loaded, setLoaded] = React.useState(false)
  const [error, setError] = React.useState(false)
  
  // 双击和长按状态管理
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null)
  const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const [isLongPressing, setIsLongPressing] = React.useState(false)

  const handleClick = () => {
    if (isEditMode && onSelect) {
      onSelect(item.id)
    } else if (onClick) {
      onClick()
    } else {
      nav(`/image/${item.id}`)
    }
  }

  // PC端双击处理
  const handleDoubleClick = () => {
    if (!isEditMode && onEnterEditMode) {
      onEnterEditMode()
      // 进入编辑模式后立即选中当前图片
      setTimeout(() => {
        if (onSelect) onSelect(item.id)
      }, 100)
    }
  }

  // 移动端长按处理
  const handleTouchStart = () => {
    if (!isEditMode && onEnterEditMode) {
      setIsLongPressing(true)
      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(false)
        onEnterEditMode()
        // 进入编辑模式后立即选中当前图片
        setTimeout(() => {
          if (onSelect) onSelect(item.id)
        }, 100)
      }, 500) // 500ms长按触发
    }
  }

  const handleTouchEnd = () => {
    setIsLongPressing(false)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTouchMove = () => {
    setIsLongPressing(false)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
    }
  }, [])

  const handleLoad = () => {
    setLoaded(true)
    setError(false)
  }

  const handleError = () => {
    console.error('图片加载失败:', item.src)
    
    // 如果是本地图片路径且加载失败，尝试使用占位图像
    if (!item.src.startsWith('http') && !item.src.startsWith('blob:') && !item.src.startsWith('data:')) {
      console.log('尝试使用占位图像替代')
    }
    
    setError(true)
    setLoaded(false)
  }

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-white transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        isEditMode && "cursor-pointer",
        isSelected && "ring-2 ring-blue-500 ring-offset-1 shadow-lg",
        isLongPressing && "scale-95 shadow-xl ring-2 ring-blue-300",
        className
      )}
    >
      {/* 编辑模式下的选择指示器 */}
      {isEditMode && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
            isSelected 
              ? "bg-blue-500 border-blue-500 text-white" 
              : "bg-white/80 border-gray-300 backdrop-blur-sm"
          )}>
            {isSelected && <Check className="w-2.5 h-2.5" />}
          </div>
        </div>
      )}
      <div className={cn("w-full overflow-hidden relative", !loaded && !error && "bg-gray-100 animate-pulse min-h-[200px]")}>
        {error ? (
          <div className="p-4 text-center text-gray-500 min-h-[200px] flex flex-col items-center justify-center">
            <div className="text-sm">图片加载失败</div>
            <div className="text-xs mt-1 truncate max-w-full">{item.title}</div>
          </div>
        ) : (
          <img
            src={item.src} // 已经在 gallery-store.tsx 中处理过路径
            alt={item.title || "图片"}
            loading="lazy"
            onLoad={handleLoad}
            onError={(e) => {
              console.error('图片加载失败:', item.src, e)
              console.error('错误详情:', e.currentTarget.src)
              handleError()
            }}
            className={cn(
              "w-full h-auto block transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
          />
        )}
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs text-gray-400">加载中...</div>
          </div>
        )}
      </div>

      <button
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        className="absolute inset-0 focus:outline-none"
        aria-label={item.title ? `查看 ${item.title}` : "查看图片"}
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0",
          "bg-gradient-to-t from-black/50 via-black/20 to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity"
        )}
      >
        <div className="p-2 text-white">
          <p className="text-xs font-medium">
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </article>
  )
}