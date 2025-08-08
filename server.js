import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import cors from 'cors'
import { fileURLToPath } from 'url'

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

// 启用 CORS - 允许前端访问
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// 创建上传目录
const uploadsDir = path.join(__dirname, 'public', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// 按年月创建子目录
const createMonthlyDir = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const monthDir = path.join(uploadsDir, String(year), month)
  
  if (!fs.existsSync(monthDir)) {
    fs.mkdirSync(monthDir, { recursive: true })
  }
  
  return `uploads/${year}/${month}`
}

// 配置 multer 直接存储到磁盘
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const uploadDir = path.join(__dirname, 'public', 'uploads', String(year), month)
      
      // 确保目录存在
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const ext = path.extname(file.originalname).toLowerCase()
      const finalFilename = `img-${uniqueSuffix}${ext}`
      cb(null, finalFilename)
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 限制
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传图片文件'))
    }
  }
})

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')))

// 上传接口
app.post('/api/upload', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有文件上传' })
    }

    console.log(`📤 成功上传 ${req.files.length} 个文件`)

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const folderPath = `uploads/${year}/${month}`

    const uploadedFiles = req.files.map(file => {
      const stats = fs.statSync(file.path)
      
      console.log(`   ✅ 文件保存成功: ${file.originalname} -> ${file.filename}`)
      
      return {
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        src: `/${folderPath}/${file.filename}`,
        title: file.originalname,
        filename: file.filename,
        size: stats.size,
        createdAt: new Date().toISOString(),
        folderPath: folderPath,
        fromUpload: true
      }
    })

    console.log(`🎉 批量上传完成: ${uploadedFiles.length} 个文件成功处理`)
    
    res.json({
      success: true,
      files: uploadedFiles,
      message: `成功上传 ${uploadedFiles.length} 个文件`
    })

  } catch (error) {
    console.error('❌ 上传处理错误:', error)
    res.status(500).json({ error: '上传失败: ' + error.message })
  }
})

// 获取所有图片列表
app.get('/api/images', (req, res) => {
  try {
    const images = []
    
    // 递归读取 uploads 目录
    const readDir = (dirPath, relativePath = '') => {
      if (!fs.existsSync(dirPath)) return
      
      const items = fs.readdirSync(dirPath)
      
      items.forEach(item => {
        const fullPath = path.join(dirPath, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          readDir(fullPath, path.join(relativePath, item))
        } else if (item.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          const relativeSrc = path.join(relativePath, item).replace(/\\/g, '/')
          images.push({
            id: `stored_${item.replace(/\.[^/.]+$/, '')}_${stat.mtime.getTime()}`,
            src: `/uploads/${relativeSrc}`,
            title: item,
            filename: item,
            size: stat.size,
            createdAt: stat.mtime.toISOString(),
            folderPath: `uploads/${relativePath}`.replace(/\\/g, '/'),
            fromUpload: true
          })
        }
      })
    }
    
    readDir(uploadsDir)
    
    // 按创建时间排序（最新优先）
    images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    res.json({ images })
    
  } catch (error) {
    console.error('获取图片列表错误:', error)
    res.status(500).json({ error: '获取图片列表失败' })
  }
})

// 删除图片接口
app.delete('/api/images/:filename', (req, res) => {
  try {
    const { filename } = req.params
    const { folderPath } = req.query // 例如: uploads/2025/08
    
    if (!filename || !folderPath) {
      return res.status(400).json({ error: '缺少文件名或路径参数' })
    }
    
    const filePath = path.join(__dirname, 'public', folderPath, filename)
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' })
    }
    
    // 删除文件
    fs.unlinkSync(filePath)
    console.log(`🗑️ 删除文件成功: ${folderPath}/${filename}`)
    
    res.json({ 
      success: true, 
      message: '文件删除成功',
      filename: filename,
      folderPath: folderPath
    })
    
  } catch (error) {
    console.error('❌ 删除文件错误:', error)
    res.status(500).json({ error: '删除文件失败: ' + error.message })
  }
})

// 批量删除图片接口
app.delete('/api/images', (req, res) => {
  try {
    const { images } = req.body // [{ filename, folderPath }, ...]
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: '缺少删除图片列表' })
    }
    
    const results = []
    let successCount = 0
    let errorCount = 0
    
    for (const img of images) {
      try {
        const filePath = path.join(__dirname, 'public', img.folderPath, img.filename)
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          results.push({ filename: img.filename, success: true })
          successCount++
          console.log(`🗑️ 删除文件成功: ${img.folderPath}/${img.filename}`)
        } else {
          results.push({ filename: img.filename, success: false, error: '文件不存在' })
          errorCount++
        }
      } catch (error) {
        results.push({ filename: img.filename, success: false, error: error.message })
        errorCount++
        console.error(`❌ 删除文件失败: ${img.filename}`, error)
      }
    }
    
    console.log(`🎉 批量删除完成: ${successCount} 成功, ${errorCount} 失败`)
    
    res.json({
      success: successCount > 0,
      message: `删除完成: ${successCount} 成功, ${errorCount} 失败`,
      results: results,
      stats: {
        total: images.length,
        success: successCount,
        failed: errorCount
      }
    })
    
  } catch (error) {
    console.error('❌ 批量删除错误:', error)
    res.status(500).json({ error: '批量删除失败: ' + error.message })
  }
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '图片上传服务运行正常' })
})

app.listen(PORT, () => {
  console.log(`🚀 图片上传服务启动成功: http://localhost:${PORT}`)
  console.log(`📁 图片存储目录: ${uploadsDir}`)
})