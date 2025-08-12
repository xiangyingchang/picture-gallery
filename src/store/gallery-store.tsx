import React, { createContext, useContext, useMemo, useState, useEffect } from "react"
import { uploadImages, fetchImages, checkServerHealth, deleteImages } from "@/services/api"
import { getAssetPath } from "@/utils/path-utils"
import { useDynamicGallery } from "@/hooks/use-dynamic-gallery"
import { getGitHubService } from "@/services/github-api"

export type ImageItem = {
  id: string
  src: string
  title: string
  createdAt: string
  folderPath: string // e.g. uploads/2025/08
  size?: number
  width?: number
  height?: number
  fromUpload?: boolean
  filename?: string // 添加 filename 属性
}

type GalleryContextType = {
  images: ImageItem[]
  addUploadedFiles: (files: File[]) => Promise<ImageItem[]>
  refreshImages: () => Promise<void>
  deleteSelectedImages: (imageIds: string[]) => Promise<void>
  getById: (id: string) => ImageItem | undefined
  sortBy: (key: "newest" | "oldest") => void
  // 编辑模式状态
  isEditMode: boolean
  selectedImages: string[]
  toggleEditMode: () => void
  toggleImageSelection: (id: string) => void
  clearSelection: () => void
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined)

function monthFolderPath(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `uploads/${y}/${m}`
}

const initialImages: ImageItem[] = [
  {
    id: "p1",
    src: "https://source.unsplash.com/random/600x400?city",
    title: "City Lights",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    folderPath: monthFolderPath(new Date(Date.now() - 86400000 * 1)),
  },
  {
    id: "p2",
    src: "https://source.unsplash.com/random/500x400?mountain",
    title: "Mountain Lake",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    folderPath: monthFolderPath(new Date(Date.now() - 86400000 * 2)),
  },
  {
    id: "p3",
    src: "https://source.unsplash.com/random/700x400?portrait",
    title: "Portrait",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    folderPath: monthFolderPath(new Date(Date.now() - 86400000 * 3)),
  },
  {
    id: "p4",
    src: "https://source.unsplash.com/random/450x400?workspace",
    title: "Workspace",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    folderPath: monthFolderPath(new Date(Date.now() - 86400000 * 4)),
  },
  {
    id: "p5",
    src: "https://source.unsplash.com/random/550x400?smile",
    title: "Smile",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    folderPath: monthFolderPath(new Date(Date.now() - 86400000 * 5)),
  },
]

export function GalleryProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<ImageItem[]>(initialImages)
  const [serverConnected, setServerConnected] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])

  // 使用动态图片加载 Hook
  const {
    images: dynamicImages,
    removeImagesFromCache
  } = useDynamicGallery()

  // 检查服务器连接并加载图片
  useEffect(() => {
    const initializeImages = async () => {
      try {
        const isConnected = await checkServerHealth()
        setServerConnected(isConnected)
        
        if (isConnected) {
          console.log('🔗 服务器连接成功，加载已上传的图片')
          const response = await fetchImages()
          const serverImages = response.images.map(img => ({
            id: img.id,
            src: getAssetPath(img.src),
            title: img.title,
            createdAt: img.createdAt,
            folderPath: img.folderPath,
            size: img.size,
            fromUpload: img.fromUpload,
            filename: img.filename,
          }))
          
          // 只使用服务器图片，避免重复 key
          setImages(serverImages.length > 0 ? serverImages : initialImages)
          console.log(`✅ 加载了 ${serverImages.length} 张服务器图片`)
        } else {
          console.log('⚠️ 服务器未连接，使用动态图片加载')
          // 不再使用静态图片列表，而是依赖动态加载
        }
      } catch (error) {
        console.error('❌ 初始化图片失败:', error)
        setServerConnected(false)
      }
    }
    
    initializeImages()
  }, [])

  // 当动态图片加载完成时，更新图片列表
  useEffect(() => {
    if (!serverConnected && dynamicImages.length > 0) {
      console.log(`🔄 使用动态加载的图片: ${dynamicImages.length} 张`)
      
      // 转换动态图片格式为 ImageItem 格式
      const convertedImages: ImageItem[] = dynamicImages.map(img => ({
        id: img.id,
        src: img.src,
        title: img.title,
        createdAt: img.created, // 使用 created 字段作为 createdAt
        folderPath: img.path.replace(`/${img.filename}`, ''),
        size: img.size,
        fromUpload: true,
        filename: img.filename
      }))
      
      setImages(convertedImages)
    }
  }, [dynamicImages, serverConnected])

  const addUploadedFiles = async (files: File[]) => {
    console.log('🚀 开始上传文件到服务器:', files.length)
    
    try {
      // 调用真实的上传 API
      const response = await uploadImages(files)
      
      console.log('✅ 服务器上传成功:', response.message)
      
      // 转换 API 响应为 ImageItem 格式
      const items: ImageItem[] = response.files.map(file => ({
        id: file.id,
        src: getAssetPath(file.src),
        title: file.title,
        createdAt: file.createdAt,
        folderPath: file.folderPath,
        size: file.size,
        fromUpload: file.fromUpload,
        filename: file.filename,
      }))
      
      // 最新优先显示
      setImages((prev) => [...items, ...prev])
      return items
      
    } catch (error) {
      console.error('❌ 上传失败:', error)
      throw error
    }
  }

  const refreshImages = async () => {
    try {
      console.log('🔄 刷新图片列表')
      const response = await fetchImages()
      const serverImages = response.images.map(img => ({
        id: img.id,
        src: getAssetPath(img.src),
        title: img.title,
        createdAt: img.createdAt,
        folderPath: img.folderPath,
        size: img.size,
        fromUpload: img.fromUpload,
        filename: img.filename,
      }))
      
      setImages(serverImages.length > 0 ? serverImages : initialImages)
      console.log(`✅ 刷新完成，加载了 ${serverImages.length} 张图片`)
    } catch (error) {
      console.error('❌ 刷新图片列表失败:', error)
      throw error
    }
  }

  // 删除选中的图片
  const deleteSelectedImages = async (imageIds: string[]) => {
    try {
      console.log('🗑️ 开始删除图片:', imageIds.length)
      
      // 获取要删除的图片信息
      const imagesToDelete = images.filter(img => imageIds.includes(img.id))
      console.log('📋 要删除的图片信息:', imagesToDelete)
      
      // 检查是否有GitHub服务可用
      const githubService = getGitHubService()
      
      if (githubService) {
        console.log('🔗 使用GitHub API删除图片')
        
        // 构建GitHub文件路径 - 使用元数据中的准确信息
        const filePaths = imagesToDelete.map(img => {
          let fullPath = ''
          
          console.log('🔍 处理图片删除:', {
            id: img.id,
            filename: img.filename,
            title: img.title,
            folderPath: img.folderPath,
            fromUpload: img.fromUpload
          })
          
          // 优先使用 filename，这是最准确的
          if (img.filename) {
            // 确保路径以 public/ 开头
            const folderPath = img.folderPath.startsWith('public/') 
              ? img.folderPath 
              : `public/${img.folderPath}`
            fullPath = `${folderPath}/${img.filename}`
            console.log('📁 使用filename构建路径:', fullPath)
            return fullPath
          }
          
          // 如果没有filename，尝试从src中提取完整路径
          if (img.src.includes('uploads/')) {
            const pathMatch = img.src.match(/uploads\/\d{4}\/\d{2}\/[^/?]+/)
            if (pathMatch) {
              fullPath = `public/${pathMatch[0]}`
              console.log('📁 从src提取路径:', fullPath)
              return fullPath
            }
          }
          
          // 最后兜底方案：使用title，但这可能不准确
          const filename = img.title || `image_${img.id}`
          const folderPath = img.folderPath.startsWith('public/') 
            ? img.folderPath 
            : `public/${img.folderPath}`
          fullPath = `${folderPath}/${filename}`
          console.log('⚠️ 兜底路径（可能不准确）:', fullPath)
          return fullPath
        })
        
        console.log('📂 最终删除路径列表:', filePaths)
        
        // 调用GitHub删除API
        const results = await githubService.deleteFiles(filePaths)
        console.log('🔄 GitHub删除结果:', results)
        
        // 分析删除结果
        const successfulDeletes = results.filter(r => r.success)
        const failedDeletes = results.filter(r => !r.success)
        
        if (successfulDeletes.length > 0) {
          console.log(`✅ 成功删除 ${successfulDeletes.length} 个文件`)
        }
        
        if (failedDeletes.length > 0) {
          console.warn(`⚠️ ${failedDeletes.length} 个文件删除失败:`, failedDeletes)
          
          // 检查是否都是因为文件不存在而失败
          const notFoundErrors = failedDeletes.filter(f => 
            f.message.includes('文件不存在') || 
            f.message.includes('404') ||
            f.message.includes('Not Found')
          )
          
          if (notFoundErrors.length === failedDeletes.length) {
            console.log('💡 所有失败都是因为文件不存在，这可能是示例图片或已被删除的图片')
            // 对于不存在的文件，我们仍然从本地状态中移除
          } else {
            // 如果有其他类型的错误，抛出异常
            const realErrors = failedDeletes.filter(f => 
              !f.message.includes('文件不存在') && 
              !f.message.includes('404') &&
              !f.message.includes('Not Found')
            )
            if (realErrors.length > 0) {
              throw new Error(`删除失败: ${realErrors.map(f => f.message).join(', ')}`)
            }
          }
        }
        
        // 触发GitHub Actions重新生成元数据
        try {
          await githubService.triggerWorkflow()
          console.log('🔄 已触发GitHub Actions更新元数据')
        } catch (workflowError) {
          console.warn('⚠️ 触发工作流失败，但删除操作已完成:', workflowError)
        }
        
      } else if (serverConnected) {
        console.log('🔗 使用本地服务器删除图片')
        
        // 使用本地服务器API
        const deleteRequests = imagesToDelete.map(img => ({
          filename: img.filename || img.title || `image_${img.id}`,
          folderPath: img.folderPath
        }))
        
        console.log('📋 服务器删除请求:', deleteRequests)
        const response = await deleteImages(deleteRequests)
        console.log('✅ 服务器删除成功:', response.message)
        
      } else {
        throw new Error('无可用的删除服务：请配置GitHub Token或启动本地服务器')
      }
      
      // 从本地状态中移除已删除的图片
      setImages(prev => prev.filter(img => !imageIds.includes(img.id)))
      
      // 同时从动态图片缓存中移除
      if (removeImagesFromCache) {
        removeImagesFromCache(imageIds)
      }
      
      // 将删除的图片ID保存到本地存储，防止重新加载时出现
      const deletedImages = JSON.parse(localStorage.getItem('deletedImages') || '[]')
      const updatedDeletedImages = [...new Set([...deletedImages, ...imageIds])]
      localStorage.setItem('deletedImages', JSON.stringify(updatedDeletedImages))
      console.log('💾 已保存删除记录到本地存储:', updatedDeletedImages)
      
      // 清空选择状态
      setSelectedImages([])
      setIsEditMode(false)
      
    } catch (error) {
      console.error('❌ 删除图片失败:', error)
      throw error
    }
  }

  // 编辑模式相关函数
  const toggleEditMode = () => {
    setIsEditMode(prev => !prev)
    if (isEditMode) {
      setSelectedImages([]) // 退出编辑模式时清空选择
    }
  }

  const toggleImageSelection = (id: string) => {
    setSelectedImages(prev => 
      prev.includes(id) 
        ? prev.filter(imgId => imgId !== id)
        : [...prev, id]
    )
  }

  const clearSelection = () => {
    setSelectedImages([])
  }

  const getById = (id: string) => images.find((i) => i.id === id)

  const sortBy = (key: "newest" | "oldest") => {
    setImages((prev) =>
      [...prev].sort((a, b) =>
        key === "newest"
          ? +new Date(b.createdAt) - +new Date(a.createdAt)
          : +new Date(a.createdAt) - +new Date(b.createdAt)
      )
    )
  }

  const value = useMemo(
    () => ({
      images,
      addUploadedFiles,
      refreshImages,
      deleteSelectedImages,
      getById,
      sortBy,
      // 编辑模式状态
      isEditMode,
      selectedImages,
      toggleEditMode,
      toggleImageSelection,
      clearSelection,
    }),
    [images, isEditMode, selectedImages]
  )

  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>
}

export function useGallery() {
  const ctx = useContext(GalleryContext)
  if (!ctx) throw new Error("useGallery must be used within GalleryProvider")
  return ctx
}