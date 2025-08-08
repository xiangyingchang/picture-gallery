// 图片处理工具函数
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      reject(new Error('不是图片文件'))
      return
    }

    // 检查文件大小 (限制 5MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('文件过大，请选择小于5MB的图片'))
      return
    }

    const reader = new FileReader()
    
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('文件读取失败'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取出错'))
    }
    
    // 开始读取
    try {
      reader.readAsDataURL(file)
    } catch (error) {
      reject(error)
    }
  })
}

// 创建图片预览URL（用于上传队列显示）
export const createPreviewUrl = (file: File): string => {
  try {
    return URL.createObjectURL(file)
  } catch (error) {
    console.error('创建预览URL失败:', error)
    return '/placeholder.svg?height=200&width=200'
  }
}

// 清理预览URL
export const revokePreviewUrl = (url: string) => {
  if (url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('清理预览URL失败:', error)
    }
  }
}