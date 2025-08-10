const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 生成图片库元数据文件
 * 扫描 public/uploads/2025/08 目录，生成 JSON 清单
 */

const UPLOADS_DIR = path.join(__dirname, '../public/uploads/2025/08');
const OUTPUT_FILE = path.join(__dirname, '../public/gallery-metadata.json');

// 支持的图片格式
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

function getFileStats(filePath) {
  const stats = fs.statSync(filePath);
  return {
    size: stats.size,
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString()
  };
}

function scanImagesDirectory() {
  console.log('🔍 扫描图片目录:', UPLOADS_DIR);
  
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error('❌ 图片目录不存在:', UPLOADS_DIR);
    return [];
  }

  const files = fs.readdirSync(UPLOADS_DIR);
  const images = [];

  files.forEach((filename, index) => {
    const filePath = path.join(UPLOADS_DIR, filename);
    const ext = path.extname(filename).toLowerCase();
    
    // 检查是否为支持的图片格式
    if (SUPPORTED_FORMATS.includes(ext) && fs.statSync(filePath).isFile()) {
      try {
        const stats = getFileStats(filePath);
        const hash = generateFileHash(filePath);
        
        const imageItem = {
          id: `img_${hash.substring(0, 8)}`,
          filename: filename,
          path: `uploads/2025/08/${filename}`,
          src: `/picture-gallery/uploads/2025/08/${filename}`,
          title: filename.replace(/\.[^/.]+$/, ''), // 移除扩展名
          size: stats.size,
          created: stats.created,
          modified: stats.modified,
          hash: hash
        };
        
        images.push(imageItem);
        console.log(`✅ 处理图片: ${filename} (${(stats.size / 1024).toFixed(1)}KB)`);
      } catch (error) {
        console.error(`❌ 处理图片失败: ${filename}`, error.message);
      }
    }
  });

  // 按修改时间排序（最新的在前）
  images.sort((a, b) => new Date(b.modified) - new Date(a.modified));
  
  return images;
}

function generateMetadata() {
  console.log('🚀 开始生成图片库元数据...');
  
  const images = scanImagesDirectory();
  
  const metadata = {
    generated: new Date().toISOString(),
    count: images.length,
    version: Date.now(), // 用于缓存控制
    images: images
  };

  // 写入元数据文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metadata, null, 2), 'utf8');
  
  console.log(`✅ 元数据生成完成!`);
  console.log(`📊 总计: ${images.length} 张图片`);
  console.log(`📄 输出文件: ${OUTPUT_FILE}`);
  
  return metadata;
}

// 如果直接运行此脚本
if (require.main === module) {
  try {
    const metadata = generateMetadata();
    console.log('🎉 图片库元数据生成成功!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 生成元数据失败:', error);
    process.exit(1);
  }
}

module.exports = { generateMetadata, scanImagesDirectory };