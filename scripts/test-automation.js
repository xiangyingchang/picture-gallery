#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { scanImageDirectory, updateGalleryStore, validateUpdate } = require('./update-gallery');

/**
 * 自动化系统测试脚本
 */

console.log('🧪 开始测试自动化系统...\n');

// 测试 1: 检查目录结构
console.log('📁 测试 1: 检查目录结构');
const imagesDir = path.join(__dirname, '../public/uploads/2025/08');
const galleryStorePath = path.join(__dirname, '../src/store/gallery-store.tsx');

if (fs.existsSync(imagesDir)) {
  console.log('✅ 图片目录存在:', imagesDir);
} else {
  console.log('❌ 图片目录不存在:', imagesDir);
}

if (fs.existsSync(galleryStorePath)) {
  console.log('✅ gallery-store.tsx 文件存在');
} else {
  console.log('❌ gallery-store.tsx 文件不存在');
}

// 测试 2: 扫描图片
console.log('\n📸 测试 2: 扫描图片目录');
try {
  const images = scanImageDirectory();
  console.log(`✅ 成功扫描到 ${images.length} 张图片`);
  
  if (images.length > 0) {
    console.log('前 5 张图片:');
    images.slice(0, 5).forEach((img, index) => {
      console.log(`  ${index + 1}. ${img.filename} (${(img.size / 1024).toFixed(2)} KB)`);
    });
  }
} catch (error) {
  console.log('❌ 扫描图片失败:', error.message);
}

// 测试 3: 验证 gallery-store.tsx 语法
console.log('\n🔍 测试 3: 验证文件语法');
try {
  const isValid = validateUpdate();
  if (isValid) {
    console.log('✅ gallery-store.tsx 语法正确');
  } else {
    console.log('❌ gallery-store.tsx 语法有问题');
  }
} catch (error) {
  console.log('❌ 验证失败:', error.message);
}

// 测试 4: 检查依赖
console.log('\n📦 测试 4: 检查依赖');
try {
  require('chokidar');
  console.log('✅ chokidar 依赖已安装');
} catch (error) {
  console.log('❌ chokidar 依赖未安装，请运行: npm install chokidar --save-dev');
}

// 测试 5: 检查 Node.js 版本
console.log('\n🔧 测试 5: 检查环境');
console.log('Node.js 版本:', process.version);
console.log('当前工作目录:', process.cwd());

// 测试 6: 检查 Git 配置
console.log('\n📝 测试 6: 检查 Git 配置');
const { exec } = require('child_process');
exec('git config user.name && git config user.email', (error, stdout, stderr) => {
  if (error) {
    console.log('⚠️  Git 用户信息未配置，自动提交功能可能无法使用');
  } else {
    console.log('✅ Git 用户信息已配置');
  }
});

console.log('\n🎉 测试完成！');
console.log('\n📋 使用说明:');
console.log('1. 手动更新: npm run gallery:update');
console.log('2. 启动监听: npm run gallery:watch');
console.log('3. 自动提交: npm run gallery:watch-auto');
console.log('4. 查看文档: docs/automation-guide.md');