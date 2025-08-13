#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔄 手动更新图片元数据...');

const UPLOADS_DIR = 'public/uploads';
const METADATA_FILE = 'public/gallery-metadata.json';

try {
  const files = fs.readdirSync(UPLOADS_DIR);
  const imageFiles = [];

  console.log('📋 扫描图片文件...');
  files.forEach(file => {
    if (file !== '.DS_Store') {
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        imageFiles.push(file);
        console.log('  ✓', file);
      }
    }
  });

  console.log(`📸 找到图片文件: ${imageFiles.length} 张`);

  const images = imageFiles.map(filename => {
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
  }).sort((a, b) => new Date(b.created) - new Date(a.created));

  const metadata = {
    generated: new Date().toISOString(),
    count: images.length,
    version: Date.now(),
    images: images,
    migrated: true,
    migrationDate: new Date().toISOString(),
    manualUpdate: true
  };

  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8');

  console.log('✅ 元数据更新完成!');
  console.log(`📊 图片总数: ${metadata.count}`);
  console.log(`📸 最新图片: ${images[0]?.filename || '无'}`);

} catch (error) {
  console.error('❌ 更新失败:', error.message);
  process.exit(1);
}