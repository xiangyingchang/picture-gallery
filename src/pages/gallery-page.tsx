import React from "react"
import MasonryGrid from "@/components/masonry-grid"
import { useGallery } from "@/store/gallery-store"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Trash2, X, CheckSquare, ArrowUpDown, Clock } from "lucide-react"

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

      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-gray-500">共 {images.length} 张图片</div>
        
        {/* 排序控制按钮 */}
        {!isEditMode && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSort(sort === "newest" ? "oldest" : "newest")}
            className="flex items-center gap-1"
          >
            <Clock className="h-4 w-4" />
            {sort === "newest" ? "最新优先" : "最旧优先"}
            <ArrowUpDown className="h-3 w-3" />
          </Button>
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
