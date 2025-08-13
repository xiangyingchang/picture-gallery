#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chokidar = require('chokidar');

const UPLOADS_DIR = 'public/uploads';
const METADATA_FILE = 'public/gallery-metadata.json';

console.log('🔍 启动图片库监控服务...');

// 生成图片元数据
function generateImageMetadata(filename) {
  const filePath = path.join(UPLOADS_DIR, filename);
  const stat = fs.statSync(filePath);
  const hash = crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
  
  return {
    id: 'img_' + hash.substring(0, 8),
    filename: filename,
    path: 'uploads/' + filename,
    src: 'uploads/' + filename,
    title: path.basename(filename, path.extname(filename)),
    size: stat.size,
    created: stat.birthtime.toISOString(),
    modified: stat.mtime.toISOString(),
    hash: hash
  };
}

// 重新生成完整元数据
function regenerateMetadata() {
  console.log('🔄 重新生成元数据...');
  
  const files = fs.readdirSync(UPLOADS_DIR);
  const imageFiles = files.filter(file => {
    if (file === '.DS_Store') return false;
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  });

  const images = imageFiles.map(generateImageMetadata)
    .sort((a, b) => new Date(b.created) - new Date(a.created));

  const metadata = {
    generated: new Date().toISOString(),
    count: images.length,
    version: Date.now(),
    images: images,
    migrated: true,
    migrationDate: new Date().toISOString()
  };

  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`✅ 元数据已更新，共 ${metadata.count} 张图片`);
  
  return metadata;
}

// 监控文件变化
const watcher = chokidar.watch(UPLOADS_DIR, {
  ignored: /(^|[\/\\])\../, // 忽略隐藏文件
  persistent: true,
  ignoreInitial: true
});

watcher
  .on('add', filePath => {
    const filename = filePath.split('/').pop();
    const ext = path.extname(filename).toLowerCase();
    
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      console.log(`📸 检测到新图片: ${filename}`);
      setTimeout(() => regenerateMetadata(), 1000); // 延迟1秒确保文件写入完成
    }
  })
  .on('unlink', filePath => {
    const filename = filePath.split('/').pop();
    console.log(`🗑️ 检测到图片删除: ${filename}`);
    setTimeout(() => regenerateMetadata(), 1000);
  })
  .on('error', error => console.log(`❌ 监控错误: ${error}`));

console.log(`👀 正在监控目录: ${UPLOADS_DIR}`);
console.log('按 Ctrl+C 停止监控');

// 初始化时生成一次元数据
regenerateMetadata();

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n🛑 停止监控服务');
  watcher.close();
  process.exit(0);
});