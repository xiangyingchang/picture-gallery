#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 开始迁移功能测试...\n');

// 测试1: 验证文件迁移完整性
function testFileMigration() {
  console.log('📁 测试1: 文件迁移完整性');
  
  const oldDir = 'public/uploads/2025/08';
  const newDir = 'public/uploads';
  
  if (!fs.existsSync(oldDir) || !fs.existsSync(newDir)) {
    console.log('❌ 目录不存在');
    return false;
  }
  
  const oldFiles = fs.readdirSync(oldDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  const newFiles = fs.readdirSync(newDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  
  console.log(`   旧目录文件数: ${oldFiles.length}`);
  console.log(`   新目录文件数: ${newFiles.length}`);
  
  // 检查文件是否都存在
  let missingFiles = 0;
  let sizeMatches = 0;
  
  for (const file of oldFiles) {
    const oldPath = path.join(oldDir, file);
    const newPath = path.join(newDir, file);
    
    if (!fs.existsSync(newPath)) {
      console.log(`   ❌ 缺失文件: ${file}`);
      missingFiles++;
    } else {
      const oldStats = fs.statSync(oldPath);
      const newStats = fs.statSync(newPath);
      
      if (oldStats.size === newStats.size) {
        sizeMatches++;
      } else {
        console.log(`   ⚠️ 文件大小不匹配: ${file}`);
      }
    }
  }
  
  console.log(`   ✅ 文件完整性: ${sizeMatches}/${oldFiles.length} 匹配`);
  console.log(`   ${missingFiles === 0 ? '✅' : '❌'} 缺失文件: ${missingFiles} 个\n`);
  
  return missingFiles === 0 && sizeMatches === oldFiles.length;
}

// 测试2: 验证元数据更新
function testMetadataUpdate() {
  console.log('📊 测试2: 元数据更新');
  
  const metadataPath = 'public/gallery-metadata.json';
  
  if (!fs.existsSync(metadataPath)) {
    console.log('   ❌ 元数据文件不存在\n');
    return false;
  }
  
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    console.log(`   图片总数: ${metadata.count}`);
    console.log(`   生成时间: ${metadata.generated}`);
    console.log(`   迁移状态: ${metadata.migrated ? '已迁移' : '未迁移'}`);
    
    // 检查路径格式
    let oldFormatCount = 0;
    let newFormatCount = 0;
    
    if (metadata.images && Array.isArray(metadata.images)) {
      for (const image of metadata.images) {
        if (image.src.includes('/2025/08/')) {
          oldFormatCount++;
        } else if (image.src.startsWith('uploads/') && !image.src.includes('/2025/')) {
          newFormatCount++;
        }
      }
    }
    
    console.log(`   旧格式路径: ${oldFormatCount} 个`);
    console.log(`   新格式路径: ${newFormatCount} 个`);
    console.log(`   ${oldFormatCount === 0 ? '✅' : '❌'} 路径格式更新完成\n`);
    
    return metadata.migrated && oldFormatCount === 0 && newFormatCount > 0;
    
  } catch (error) {
    console.log(`   ❌ 元数据解析失败: ${error.message}\n`);
    return false;
  }
}

// 测试3: 验证路径兼容性
function testPathCompatibility() {
  console.log('🔄 测试3: 路径兼容性');
  
  // 模拟路径转换测试
  const testCases = [
    {
      input: 'uploads/2025/08/IMG_1234.jpg',
      expected: 'uploads/IMG_1234.jpg'
    },
    {
      input: 'public/uploads/2025/08/test.png',
      expected: 'public/uploads/test.png'
    },
    {
      input: 'uploads/already-new.jpg',
      expected: 'uploads/already-new.jpg'
    }
  ];
  
  let passedTests = 0;
  
  // 简单的路径转换逻辑（模拟兼容性工具）
  function convertLegacyPath(oldPath) {
    if (!oldPath.includes('/2025/') && !oldPath.includes('/2024/')) {
      return oldPath;
    }
    
    const filename = oldPath.split('/').pop();
    if (!filename) return oldPath;
    
    const basePath = oldPath.startsWith('public/') ? 'public/uploads' : 'uploads';
    return `${basePath}/${filename}`;
  }
  
  for (const testCase of testCases) {
    const result = convertLegacyPath(testCase.input);
    const passed = result === testCase.expected;
    
    console.log(`   ${passed ? '✅' : '❌'} ${testCase.input} → ${result}`);
    if (passed) passedTests++;
  }
  
  console.log(`   路径转换测试: ${passedTests}/${testCases.length} 通过\n`);
  
  return passedTests === testCases.length;
}

// 测试4: 验证文件访问性
async function testFileAccessibility() {
  console.log('🌐 测试4: 文件访问性');
  
  const metadataPath = 'public/gallery-metadata.json';
  
  if (!fs.existsSync(metadataPath)) {
    console.log('   ❌ 元数据文件不存在\n');
    return false;
  }
  
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const testImages = metadata.images.slice(0, 5); // 测试前5张图片
    
    let accessibleCount = 0;
    
    for (const image of testImages) {
      const filePath = `public/${image.src}`;
      
      if (fs.existsSync(filePath)) {
        accessibleCount++;
        console.log(`   ✅ ${image.src}`);
      } else {
        console.log(`   ❌ ${image.src} (文件不存在)`);
      }
    }
    
    console.log(`   文件可访问性: ${accessibleCount}/${testImages.length}\n`);
    
    return accessibleCount === testImages.length;
    
  } catch (error) {
    console.log(`   ❌ 测试失败: ${error.message}\n`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  const results = {
    fileMigration: testFileMigration(),
    metadataUpdate: testMetadataUpdate(),
    pathCompatibility: testPathCompatibility(),
    fileAccessibility: await testFileAccessibility()
  };
  
  console.log('📋 测试结果汇总:');
  console.log(`   文件迁移: ${results.fileMigration ? '✅ 通过' : '❌ 失败'}`);
  console.log(`   元数据更新: ${results.metadataUpdate ? '✅ 通过' : '❌ 失败'}`);
  console.log(`   路径兼容性: ${results.pathCompatibility ? '✅ 通过' : '❌ 失败'}`);
  console.log(`   文件访问性: ${results.fileAccessibility ? '✅ 通过' : '❌ 失败'}`);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  console.log(`\n🎯 总体结果: ${allPassed ? '✅ 全部通过' : '❌ 存在问题'}`);
  
  if (allPassed) {
    console.log('\n🎉 迁移功能测试完成！所有测试都通过了。');
    console.log('💡 建议: 现在可以安全地清理旧目录结构。');
  } else {
    console.log('\n⚠️ 发现问题，请检查失败的测试项目。');
  }
  
  return allPassed;
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };