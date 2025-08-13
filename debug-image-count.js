const fs = require('fs');

// 读取元数据
const metadata = JSON.parse(fs.readFileSync('public/gallery-metadata.json', 'utf8'));

console.log('=== 图片数量调试 ===');
console.log('元数据中的count字段:', metadata.count);
console.log('元数据images数组长度:', metadata.images.length);

// 模拟前端的过滤逻辑
console.log('\n=== 模拟前端过滤逻辑 ===');

// 1. 模拟本地删除记录（这个在浏览器localStorage中）
const mockDeletedImages = []; // 假设为空，实际需要检查浏览器
console.log('模拟删除记录:', mockDeletedImages);

// 2. 应用过滤
const filteredImages = metadata.images.filter(img => !mockDeletedImages.includes(img.id));
console.log('过滤后的图片数量:', filteredImages.length);

// 3. 检查是否有无效图片
console.log('\n=== 检查图片有效性 ===');
let validCount = 0;
let invalidCount = 0;

for (const img of metadata.images) {
  const filePath = `public/${img.path}`;
  try {
    if (fs.existsSync(filePath)) {
      validCount++;
    } else {
      invalidCount++;
      console.log('文件不存在:', filePath);
    }
  } catch (error) {
    invalidCount++;
    console.log('检查文件时出错:', filePath, error.message);
  }
}

console.log('有效文件数量:', validCount);
console.log('无效文件数量:', invalidCount);

// 4. 检查是否有特殊字符或编码问题
console.log('\n=== 检查文件名编码问题 ===');
const problematicFiles = [];
for (const img of metadata.images) {
  if (img.filename.includes('?') || img.filename.includes('#') || img.filename.includes('%')) {
    problematicFiles.push(img.filename);
  }
}

if (problematicFiles.length > 0) {
  console.log('可能有编码问题的文件:', problematicFiles);
} else {
  console.log('未发现文件名编码问题');
}

// 5. 总结
console.log('\n=== 总结 ===');
console.log('如果前端显示146张，可能的原因:');
console.log('1. 本地存储中有1个删除记录');
console.log('2. 有1个文件实际不存在但在元数据中');
console.log('3. 前端渲染时有其他过滤逻辑');
console.log('4. 有重复的图片被去重了');

// 6. 检查最新添加的图片
console.log('\n=== 最新添加的图片 ===');
const sortedImages = metadata.images.sort((a, b) => new Date(b.created) - new Date(a.created));
console.log('最新的5张图片:');
sortedImages.slice(0, 5).forEach((img, index) => {
  console.log(`${index + 1}. ${img.filename} (${img.created})`);
});