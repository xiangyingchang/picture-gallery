// API 服务配置 - 使用代理路径
const API_BASE_URL = '/api'

export interface UploadResponse {
  success: boolean
  files: Array<{
    id: string
    src: string
    title: string
    filename: string
    size: number
    createdAt: string
    folderPath: string
    fromUpload: boolean
  }>
  message: string
}

export interface ImagesResponse {
  images: Array<{
    id: string
    src: string
    title: string
    filename: string
    size: number
    createdAt: string
    folderPath: string
    fromUpload: boolean
  }>
}

// 上传图片到服务器
export const uploadImages = async (files: File[]): Promise<UploadResponse> => {
  const formData = new FormData()
  
  files.forEach(file => {
    formData.append('images', file)
  })
  
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '上传失败')
  }
  
  return response.json()
}

// 获取所有图片
export const fetchImages = async (): Promise<ImagesResponse> => {
  const response = await fetch(`${API_BASE_URL}/images`)
  
  if (!response.ok) {
    throw new Error('获取图片列表失败')
  }
  
  return response.json()
}

// 检查服务器状态
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}

// 删除单个图片
export const deleteImage = async (filename: string, folderPath: string) => {
  const response = await fetch(`${API_BASE_URL}/images/${filename}?folderPath=${encodeURIComponent(folderPath)}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '删除失败')
  }
  
  return response.json()
}

// 批量删除图片
export const deleteImages = async (images: { filename: string; folderPath: string }[]) => {
  const response = await fetch(`${API_BASE_URL}/images`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ images }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '批量删除失败')
  }
  
  return response.json()
}
