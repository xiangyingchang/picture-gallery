#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 自动化图片库更新脚本
 * 功能：扫描图片目录，自动更新 gallery-store.tsx 中的图片列表
 */

// 配置
const CONFIG = {
  // 图片目录路径
  IMAGES_DIR: path.join(__dirname, '../public/uploads/2025/08'),
  // gallery-store.tsx 文件路径
  GALLERY_STORE_PATH: path.join(__dirname, '../src/store/gallery-store.tsx'),
  // 支持的图片格式
  SUPPORTED_FORMATS: ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG', '.WEBP'],
  // 日志文件路径
  LOG_FILE: path.join(__dirname, '../logs/gallery-update.log')
};

/**
 * 日志记录函数
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  
  // 确保日志目录存在
  const logDir = path.dirname(CONFIG.LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // 写入日志文件
  fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
}

/**
 * 验证图片格式
 */
function isValidImageFormat(filename) {
  const ext = path.extname(filename).toLowerCase();
  return CONFIG.SUPPORTED_FORMATS.some(format => 
    format.toLowerCase() === ext
  );
}

/**
 * 获取图片文件信息
 */
function getImageInfo(filename, filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      filename,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isValid: isValidImageFormat(filename)
    };
  } catch (error) {
    log(`获取文件信息失败: ${filename} - ${error.message}`, 'ERROR');
    return null;
  }
}

/**
 * 扫描图片目录
 */
function scanImageDirectory() {
  log('开始扫描图片目录...');
  
  if (!fs.existsSync(CONFIG.IMAGES_DIR)) {
    log(`图片目录不存在: ${CONFIG.IMAGES_DIR}`, 'ERROR');
    return [];
  }
  
  try {
    const files = fs.readdirSync(CONFIG.IMAGES_DIR);
    const imageFiles = [];
    
    for (const file of files) {
      // 跳过隐藏文件和系统文件
      if (file.startsWith('.') || file === 'Thumbs.db') {
        continue;
      }
      
      const filePath = path.join(CONFIG.IMAGES_DIR, file);
      const imageInfo = getImageInfo(file, filePath);
      
      if (imageInfo && imageInfo.isValid) {
        imageFiles.push(imageInfo);
        log(`发现有效图片: ${file} (${(imageInfo.size / 1024).toFixed(2)} KB)`);
      } else if (imageInfo && !imageInfo.isValid) {
        log(`跳过不支持的文件格式: ${file}`, 'WARN');
      }
    }
    
    log(`扫描完成，发现 ${imageFiles.length} 张有效图片`);
    return imageFiles;
    
  } catch (error) {
    log(`扫描目录失败: ${error.message}`, 'ERROR');
    return [];
  }
}

/**
 * 生成图片列表代码
 */
function generateImageListCode(imageFiles) {
  const imageFileNames = imageFiles
    .sort((a, b) => b.modifiedAt - a.modifiedAt) // 按修改时间倒序排列
    .map(img => `"${img.filename}"`);
  
  return `            // 实际存在的图片文件列表（自动生成于 ${new Date().toISOString()}）
            const imageFiles = [
              ${imageFileNames.join(',\n              ')}
            ];`;
}

/**
 * 更新 gallery-store.tsx 文件
 */
function updateGalleryStore(imageFiles) {
  log('开始更新 gallery-store.tsx 文件...');
  
  try {
    // 读取当前文件内容
    const content = fs.readFileSync(CONFIG.GALLERY_STORE_PATH, 'utf8');
    
    // 生成新的图片列表代码
    const newImageListCode = generateImageListCode(imageFiles);
    
    // 使用正则表达式替换图片列表部分
    const imageListRegex = /\/\/ 实际存在的图片文件列表[\s\S]*?const imageFiles = \[[\s\S]*?\];/;
    
    if (!imageListRegex.test(content)) {
      log('未找到图片列表标记，无法自动更新', 'ERROR');
      return false;
    }
    
    const updatedContent = content.replace(imageListRegex, newImageListCode);
    
    // 备份原文件
    const backupPath = CONFIG.GALLERY_STORE_PATH + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, content);
    log(`已创建备份文件: ${path.basename(backupPath)}`);
    
    // 写入更新后的内容
    fs.writeFileSync(CONFIG.GALLERY_STORE_PATH, updatedContent);
    log(`成功更新 gallery-store.tsx，包含 ${imageFiles.length} 张图片`);
    
    return true;
    
  } catch (error) {
    log(`更新文件失败: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * 验证更新结果
 */
function validateUpdate() {
  log('验证更新结果...');
  
  try {
    // 尝试解析更新后的文件
    const content = fs.readFileSync(CONFIG.GALLERY_STORE_PATH, 'utf8');
    
    // 检查语法是否正确（简单检查）
    if (content.includes('const imageFiles = [') && content.includes('];')) {
      log('文件语法验证通过');
      return true;
    } else {
      log('文件语法验证失败', 'ERROR');
      return false;
    }
    
  } catch (error) {
    log(`验证失败: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * 生成处理报告
 */
function generateReport(imageFiles, updateSuccess) {
  const report = {
    timestamp: new Date().toISOString(),
    totalImages: imageFiles.length,
    updateSuccess,
    images: imageFiles.map(img => ({
      filename: img.filename,
      size: img.size,
      format: path.extname(img.filename).toLowerCase()
    }))
  };
  
  const reportPath = path.join(__dirname, '../logs/gallery-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`处理报告已生成: ${reportPath}`);
  return report;
}

/**
 * 主函数
 */
async function main() {
  log('=== 开始图片库自动更新流程 ===');
  
  try {
    // 1. 扫描图片目录
    const imageFiles = scanImageDirectory();
    
    if (imageFiles.length === 0) {
      log('未发现有效图片文件，流程结束', 'WARN');
      return;
    }
    
    // 2. 更新 gallery-store.tsx
    const updateSuccess = updateGalleryStore(imageFiles);
    
    if (!updateSuccess) {
      log('更新失败，流程中止', 'ERROR');
      process.exit(1);
    }
    
    // 3. 验证更新结果
    const validationSuccess = validateUpdate();
    
    if (!validationSuccess) {
      log('验证失败，请检查文件内容', 'ERROR');
      process.exit(1);
    }
    
    // 4. 生成处理报告
    const report = generateReport(imageFiles, updateSuccess);
    
    log('=== 图片库自动更新流程完成 ===');
    log(`处理结果: ${report.totalImages} 张图片，更新${updateSuccess ? '成功' : '失败'}`);
    
  } catch (error) {
    log(`流程执行失败: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  scanImageDirectory,
  updateGalleryStore,
  validateUpdate,
  generateReport
};