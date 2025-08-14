import React from "react"
import MasonryGrid from "@/components/masonry-grid"
import { useGallery } from "@/store/gallery-store"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Trash2, X, CheckSquare } from "lucide-react"

export default function GalleryPage() {
  const { toast } = useToast()
  const { 
    images, 
    sortBy, 
    isEditMode, 
    selectedImages, 
    toggleEditMode, 
    toggleImageSelection, 
    clearSelection,
    deleteSelectedImages 
  } = useGallery()
  const [sort, setSort] = React.useState<"newest" | "oldest">("newest")
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    sortBy(sort)
  }, [sort])

  const handleDelete = async () => {
    if (selectedImages.length === 0) return
    
    try {
      setIsDeleting(true)
      await deleteSelectedImages(selectedImages)
      
      toast({
        title: "删除成功",
        description: `已删除 ${selectedImages.length} 张图片`
      })
    } catch (error) {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelEdit = () => {
    clearSelection()
    toggleEditMode()
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
      {/* 编辑模式提示 */}
      {isEditMode && (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <CheckSquare className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            编辑模式已激活：点击图片进行选择，已选择 {selectedImages.length} 张图片
            <br />
            <span className="text-xs text-blue-600 mt-1 block">
              💡 提示：PC端双击图片或移动端长按图片可进入编辑模式
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="text-sm text-gray-500">共 {images.length} 张图片</div>
        
        {/* 排序控制 - 用三条横线长度表示排序方向 */}
        {!isEditMode && (
          <button 
            onClick={() => setSort(sort === "newest" ? "oldest" : "newest")}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 flex items-center gap-2 group"
            title={sort === "newest" ? "当前：最新优先，点击切换到最旧优先" : "当前：最旧优先，点击切换到最新优先"}
          >
            {/* 自定义排序图标 */}
            <svg 
              width="14" 
              height="12" 
              viewBox="0 0 14 12" 
              className="opacity-60 group-hover:opacity-80 transition-opacity"
            >
              {sort === "newest" ? (
                // 最新优先：长→中→短
                <>
                  <rect x="0" y="1" width="14" height="1.5" fill="currentColor" rx="0.75" />
                  <rect x="2" y="5" width="10" height="1.5" fill="currentColor" rx="0.75" />
                  <rect x="4" y="9" width="6" height="1.5" fill="currentColor" rx="0.75" />
                </>
              ) : (
                // 最旧优先：短→中→长
                <>
                  <rect x="4" y="1" width="6" height="1.5" fill="currentColor" rx="0.75" />
                  <rect x="2" y="5" width="10" height="1.5" fill="currentColor" rx="0.75" />
                  <rect x="0" y="9" width="14" height="1.5" fill="currentColor" rx="0.75" />
                </>
              )}
            </svg>
            <span className="text-xs text-gray-500">
              排序
            </span>
          </button>
        )}
        
        {isEditMode && (
          <div className="ml-auto flex gap-2">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDelete}
              disabled={selectedImages.length === 0 || isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              删除 ({selectedImages.length})
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
              <X className="h-4 w-4 mr-1" />
              取消
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4">
        <MasonryGrid 
          items={images} 
          isEditMode={isEditMode}
          selectedImages={selectedImages}
          onImageSelect={toggleImageSelection}
          onEnterEditMode={toggleEditMode}
        />
      </div>

      {images.length === 0 && (
        <div className="py-16 text-center text-sm text-gray-500">
          暂无图片，点击"上传图片"开始添加
        </div>
      )}
    </div>
  )
}