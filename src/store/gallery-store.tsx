import React, { createContext, useContext, useMemo, useState, useEffect } from "react"
import { uploadImages, fetchImages, checkServerHealth, deleteImages } from "@/services/api"
import { getAssetPath } from "@/utils/path-utils"

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
          console.log('⚠️ 服务器未连接，使用本地图片数据')
          
          // 创建本地图片数据 - 使用实际存在的图片文件
          const generateLocalImages = () => {
            const folderPath = "uploads/2025/08";
            const localImages: ImageItem[] = [];
            
                                                // 实际存在的图片文件列表（自动生成于 2025-08-10T14:23:55.599Z）
            const imageFiles = [
              "mmexport1736832843760.jpg",
              "mmexport1736936463344.jpg",
              "mmexport1735908496461.jpg",
              "mmexport1736050148665.jpg",
              "mmexport1736780324615.jpg",
              "mmexport1735056004829.jpg",
              "mmexport1735362713457.jpg",
              "mmexport1735711028629.jpg",
              "a89f624fe6feff074da8209b4a2f5ae2.jpg",
              "mmexport1729696189561.png",
              "mmexport1734244006861.jpg",
              "a5257b1a907a8919ee4ca02e168958a0.JPG",
              "IMG_8581.JPG",
              "IMG_9724.JPG",
              "IMG_8455.JPG",
              "IMG_8483 (1).JPG",
              "IMG_8410.JPG",
              "IMG_7886.JPG",
              "IMG_8220.JPG",
              "IMG_7672.JPG",
              "IMG_7319.JPG",
              "IMG_7246.JPG",
              "IMG_7154.JPG",
              "IMG_7122.JPG",
              "IMG_7096.JPG",
              "IMG_7087 (1).JPG",
              "IMG_6819.JPG",
              "IMG_6980.JPG",
              "IMG_6739.JPG",
              "IMG_6756.JPG",
              "IMG_6735.JPG",
              "IMG_6697.JPG",
              "IMG_6666.JPG",
              "IMG_6683.JPG",
              "IMG_6650.JPG",
              "IMG_6657.JPG",
              "IMG_6603.JPG",
              "IMG_6638.JPG",
              "IMG_6645.JPG",
              "IMG_6509.JPG",
              "IMG_6602.JPG",
              "IMG_6506.JPG",
              "IMG_6451.JPG",
              "IMG_6441.JPG",
              "IMG_6447.JPG",
              "IMG_6377.JPG",
              "IMG_6394.JPG",
              "IMG_6333.JPG",
              "IMG_6181.JPG",
              "IMG_6271.JPG",
              "IMG_6325.JPG",
              "IMG_5825.JPG",
              "IMG_6060.JPG",
              "IMG_6143.JPG",
              "IMG_5779.JPG",
              "IMG_5701.jpeg",
              "IMG_5769.JPG",
              "IMG_5671.JPG",
              "IMG_5514.JPG",
              "IMG_5501.JPG",
              "IMG_5459.JPG",
              "IMG_5465.JPG",
              "IMG_5439.JPG",
              "IMG_5442.JPG",
              "IMG_5381.JPG",
              "IMG_5395.JPG",
              "IMG_5422.JPG",
              "IMG_5425.JPG",
              "IMG_5427.JPG",
              "IMG_5119.JPG",
              "IMG_5215.JPG",
              "IMG_5070.JPG",
              "IMG_5050 (1).JPG",
              "IMG_5038.JPG",
              "IMG_4925.JPG",
              "IMG_5008.JPG",
              "IMG_4906.JPG",
              "IMG_4390.JPG",
              "IMG_4495.JPG",
              "IMG_4759.JPG",
              "IMG_4164.JPG",
              "IMG_4364 (1).JPG",
              "IMG_4112.JPG",
              "IMG_4128.JPG",
              "IMG_4137.JPG",
              "IMG_4061.JPG",
              "IMG_4069.JPG",
              "IMG_4107.JPG",
              "IMG_4013.JPG",
              "IMG_4028.JPG",
              "IMG_4033.JPG",
              "IMG_4040.JPG",
              "IMG_3972.JPG",
              "IMG_3998.JPG",
              "IMG_3911.JPG",
              "IMG_3943.JPG",
              "IMG_3946.JPG",
              "IMG_3824.JPG",
              "IMG_3874.JPG",
              "IMG_3636.JPG",
              "IMG_3712.JPG",
              "IMG_3756.JPG",
              "IMG_3811.JPG",
              "IMG_3610.JPG",
              "IMG_3620.JPG",
              "IMG_3160.JPG",
              "IMG_3213.JPG",
              "IMG_3568.JPG",
              "IMG_3569.JPG",
              "IMG_2679.JPG",
              "IMG_2957.JPG",
              "IMG_2974.JPG",
              "IMG_3058.JPG",
              "IMG_2326.JPG",
              "IMG_2548.JPG",
              "IMG_2562.JPG",
              "IMG_2656.JPG",
              "IMG_2267 (1).JPG",
              "IMG_2304.JPG",
              "IMG_2005.JPG",
              "IMG_2118.JPG",
              "IMG_1730.JPG",
              "IMG_1891.JPG",
              "IMG_2002.JPG",
              "IMG_1207_2.JPG",
              "IMG_1537.JPG",
              "IMG_1194.JPG",
              "IMG_0693.JPG",
              "IMG_0695.JPG",
              "IMG_0599.JPG",
              "IMG_0662.JPG",
              "IMG_0486.JPG",
              "IMG_0561.JPG",
              "IMG_0362_2.JPG",
              "IMG_0485.JPG",
              "IMG_0357.JPG",
              "IMG_0190.JPG",
              "IMG_0221.JPG",
              "IMG_0226.JPG",
              "IMG_0314.JPG",
              "IMG_0120.JPG",
              "IMG_0162.JPG",
              "IMG_0164.JPG",
              "IMG_0104.JPG",
              "IMG_0089.JPG",
              "7dbe04adb3713da2c78a8e0f3c2663aa.jpg",
              "4346d1e6d04bf2e4b66a5aeccac4234d.jpg"
            ];
            
            // 为每个实际存在的图片文件创建 ImageItem
            imageFiles.forEach((file, index) => {
              localImages.push({
                id: `local${index + 1}`,
                src: getAssetPath(`/${folderPath}/${file}`),
                title: file.replace(/\.[^/.]+$/, ""), // 移除文件扩展名作为标题
                createdAt: new Date(Date.now() - 86400000 * (index + 1)).toISOString(),
                folderPath: folderPath,
                fromUpload: true,
                filename: file
              });
            });
            
            return localImages;
          };
          
          const localImages = generateLocalImages();
          console.log(`📷 生成了 ${localImages.length} 张本地图片数据`);
          setImages(localImages);
        }
      } catch (error) {
        console.error('❌ 初始化图片失败:', error)
        setServerConnected(false)
      }
    }
    
    initializeImages()
  }, [])

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
      const deleteRequests = imagesToDelete.map(img => ({
        filename: img.filename || img.title,
        folderPath: img.folderPath
      }))
      
      // 调用删除API
      const response = await deleteImages(deleteRequests)
      console.log('✅ 服务器删除成功:', response.message)
      
      // 从本地状态中移除已删除的图片
      setImages(prev => prev.filter(img => !imageIds.includes(img.id)))
      
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