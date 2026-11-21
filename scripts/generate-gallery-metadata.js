const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const exifr = require('exifr');

const REPOSITORY_ROOT = path.join(__dirname, '..');

/**
 * 生成图片库元数据文件
 * 扫描 public/uploads/2025/08 目录，生成 JSON 清单
 */

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
const OUTPUT_FILE = path.join(__dirname, '../public/gallery-metadata.json');

// 支持的图片格式
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

function getUploadTime(filePath) {
  const relativePath = path.relative(REPOSITORY_ROOT, filePath).replace(/\\/g, '/');

  try {
    const history = execFileSync(
      'git',
      ['log', '--follow', '--diff-filter=A', '--format=%cI', '--', relativePath],
      {
        cwd: REPOSITORY_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }
    ).trim();

    const uploadedAt = history.split(/\r?\n/)[0];
    if (uploadedAt && !Number.isNaN(Date.parse(uploadedAt))) {
      return new Date(uploadedAt).toISOString();
    }
  } catch (error) {
    console.log(`⚠️  Git 上传记录不可用: ${path.basename(filePath)}`);
  }

  // For files outside Git history, use the local file creation time as a fallback.
  return fs.statSync(filePath).birthtime.toISOString();
}

async function getFileStats(filePath) {
  const stats = fs.statSync(filePath);
  let actualCreatedTime = stats.birthtime;
  
  try {
    // 尝试读取 EXIF 数据获取真正的拍摄时间
    const exifData = await exifr.parse(filePath);
    if (exifData && exifData.DateTimeOriginal) {
      actualCreatedTime = new Date(exifData.DateTimeOriginal);
      console.log(`📸 EXIF 拍摄时间: ${path.basename(filePath)} -> ${actualCreatedTime.toISOString()}`);
    } else if (exifData && exifData.DateTime) {
      actualCreatedTime = new Date(exifData.DateTime);
      console.log(`📸 EXIF 修改时间: ${path.basename(filePath)} -> ${actualCreatedTime.toISOString()}`);
    } else {
      console.log(`⚠️  无 EXIF 数据: ${path.basename(filePath)} -> 使用文件创建时间`);
    }
  } catch (error) {
    console.log(`⚠️  EXIF 读取失败: ${path.basename(filePath)} -> 使用文件创建时间`);
  }
  
  return {
    size: stats.size,
    created: actualCreatedTime.toISOString(),
    modified: stats.mtime.toISOString(),
    uploadedAt: getUploadTime(filePath)
  };
}

async function scanImagesDirectory() {
  console.log('🔍 扫描图片目录:', UPLOADS_DIR);
  
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error('❌ 图片目录不存在:', UPLOADS_DIR);
    return [];
  }

  const files = fs.readdirSync(UPLOADS_DIR);
  const images = [];

  // 使用 for...of 循环支持异步操作
  for (const filename of files) {
    const filePath = path.join(UPLOADS_DIR, filename);
    const ext = path.extname(filename).toLowerCase();
    
    // 检查是否为支持的图片格式
    if (SUPPORTED_FORMATS.includes(ext) && fs.statSync(filePath).isFile()) {
      try {
        const stats = await getFileStats(filePath);
        const hash = generateFileHash(filePath);
        
        const imageItem = {
          id: `img_${hash.substring(0, 8)}`,
          filename: filename,
          path: `uploads/${filename}`,
          src: `/picture-gallery/uploads/${filename}`,
          title: filename.replace(/\.[^/.]+$/, ''), // 移除扩展名
          size: stats.size,
          created: stats.created,
          modified: stats.modified,
          uploadedAt: stats.uploadedAt,
          hash: hash
        };
        
        images.push(imageItem);
        console.log(`✅ 处理图片: ${filename} (${(stats.size / 1024).toFixed(1)}KB)`);
      } catch (error) {
        console.error(`❌ 处理图片失败: ${filename}`, error.message);
      }
    }
  }

  // 按上传时间排序（最新的在前）
  images.sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt));
  
  return images;
}

async function generateMetadata() {
  console.log('🚀 开始生成图片库元数据...');
  
  const images = await scanImagesDirectory();
  
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
  (async () => {
    try {
      const metadata = await generateMetadata();
      console.log('🎉 图片库元数据生成成功!');
      process.exit(0);
    } catch (error) {
      console.error('❌ 生成元数据失败:', error);
      process.exit(1);
    }
  })();
}

module.exports = { generateMetadata, scanImagesDirectory };
