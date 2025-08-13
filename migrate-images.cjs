#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ImageMigrator {
  constructor() {
    this.sourceDir = 'public/uploads/2025/08';
    this.targetDir = 'public/uploads';
    this.metadataFile = 'public/gallery-metadata.json';
    this.backupDir = 'backup-migration';
    this.migrationLog = [];
  }

  // 扫描所有需要迁移的图片文件
  scanImages() {
    console.log('🔍 扫描图片文件...');
    
    if (!fs.existsSync(this.sourceDir)) {
      console.log('❌ 源目录不存在:', this.sourceDir);
      return [];
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const images = [];

    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (imageExtensions.includes(ext)) {
            const relativePath = path.relative('public', fullPath);
            images.push({
              filename: item,
              sourcePath: fullPath,
              targetPath: path.join(this.targetDir, item),
              relativePath: relativePath,
              size: stat.size,
              modified: stat.mtime
            });
          }
        }
      }
    };

    scanDirectory(this.sourceDir);
    
    console.log(`✅ 发现 ${images.length} 张图片需要迁移`);
    return images;
  }

  // 检查文件名冲突
  checkConflicts(images) {
    console.log('🔍 检查文件名冲突...');
    
    const conflicts = [];
    const nameMap = new Map();
    
    for (const image of images) {
      if (nameMap.has(image.filename)) {
        conflicts.push({
          filename: image.filename,
          paths: [nameMap.get(image.filename), image.sourcePath]
        });
      } else {
        nameMap.set(image.filename, image.sourcePath);
      }
    }
    
    if (conflicts.length > 0) {
      console.log('⚠️  发现文件名冲突:');
      conflicts.forEach(conflict => {
        console.log(`   - ${conflict.filename}:`);
        conflict.paths.forEach(p => console.log(`     ${p}`));
      });
      return false;
    }
    
    console.log('✅ 无文件名冲突');
    return true;
  }

  // 创建备份
  createBackup() {
    console.log('💾 创建备份...');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    // 备份元数据文件
    if (fs.existsSync(this.metadataFile)) {
      const backupMetadata = path.join(this.backupDir, 'gallery-metadata.json');
      fs.copyFileSync(this.metadataFile, backupMetadata);
      console.log('✅ 元数据文件已备份');
    }
    
    console.log('✅ 备份完成');
  }

  // 执行文件迁移
  migrateFiles(images) {
    console.log('📁 开始迁移文件...');
    
    // 确保目标目录存在
    if (!fs.existsSync(this.targetDir)) {
      fs.mkdirSync(this.targetDir, { recursive: true });
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const image of images) {
      try {
        // 检查目标文件是否已存在
        if (fs.existsSync(image.targetPath)) {
          console.log(`⚠️  目标文件已存在，跳过: ${image.filename}`);
          continue;
        }
        
        // 复制文件
        fs.copyFileSync(image.sourcePath, image.targetPath);
        
        // 验证复制结果
        const sourceStats = fs.statSync(image.sourcePath);
        const targetStats = fs.statSync(image.targetPath);
        
        if (sourceStats.size === targetStats.size) {
          successCount++;
          this.migrationLog.push({
            action: 'copy',
            source: image.sourcePath,
            target: image.targetPath,
            status: 'success',
            timestamp: new Date().toISOString()
          });
          console.log(`✅ ${image.filename}`);
        } else {
          throw new Error('文件大小不匹配');
        }
        
      } catch (error) {
        errorCount++;
        this.migrationLog.push({
          action: 'copy',
          source: image.sourcePath,
          target: image.targetPath,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.log(`❌ ${image.filename}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 迁移结果: 成功 ${successCount} 个，失败 ${errorCount} 个`);
    return { successCount, errorCount };
  }

  // 更新元数据文件
  updateMetadata() {
    console.log('📝 更新元数据文件...');
    
    if (!fs.existsSync(this.metadataFile)) {
      console.log('❌ 元数据文件不存在');
      return false;
    }
    
    try {
      const metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
      
      // 更新图片路径
      if (metadata.images && Array.isArray(metadata.images)) {
        metadata.images = metadata.images.map(image => {
          if (image.src && image.src.includes('uploads/2025/08/')) {
            const filename = path.basename(image.src);
            image.src = `uploads/${filename}`;
            console.log(`✅ 更新路径: ${filename}`);
          }
          return image;
        });
      }
      
      // 更新生成时间
      metadata.generated = new Date().toISOString();
      metadata.migrated = true;
      metadata.migrationDate = new Date().toISOString();
      
      // 保存更新后的元数据
      fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2));
      console.log('✅ 元数据文件已更新');
      return true;
      
    } catch (error) {
      console.log('❌ 更新元数据失败:', error.message);
      return false;
    }
  }

  // 保存迁移日志
  saveMigrationLog() {
    const logFile = path.join(this.backupDir, 'migration-log.json');
    const logData = {
      timestamp: new Date().toISOString(),
      sourceDir: this.sourceDir,
      targetDir: this.targetDir,
      operations: this.migrationLog
    };
    
    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
    console.log(`📋 迁移日志已保存: ${logFile}`);
  }

  // 验证迁移结果
  verifyMigration(originalImages) {
    console.log('🔍 验证迁移结果...');
    
    let verifiedCount = 0;
    let errorCount = 0;
    
    for (const image of originalImages) {
      try {
        if (fs.existsSync(image.targetPath)) {
          const sourceStats = fs.statSync(image.sourcePath);
          const targetStats = fs.statSync(image.targetPath);
          
          if (sourceStats.size === targetStats.size) {
            verifiedCount++;
          } else {
            console.log(`❌ 文件大小不匹配: ${image.filename}`);
            errorCount++;
          }
        } else {
          console.log(`❌ 目标文件不存在: ${image.filename}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`❌ 验证失败: ${image.filename} - ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 验证结果: 成功 ${verifiedCount} 个，失败 ${errorCount} 个`);
    return errorCount === 0;
  }

  // 主执行函数
  async run() {
    console.log('🚀 开始图片路径迁移...\n');
    
    try {
      // 1. 扫描图片
      const images = this.scanImages();
      if (images.length === 0) {
        console.log('❌ 没有找到需要迁移的图片');
        return;
      }
      
      // 2. 检查冲突
      if (!this.checkConflicts(images)) {
        console.log('❌ 存在文件名冲突，请手动解决后重试');
        return;
      }
      
      // 3. 创建备份
      this.createBackup();
      
      // 4. 迁移文件
      const result = this.migrateFiles(images);
      
      // 5. 更新元数据
      this.updateMetadata();
      
      // 6. 保存日志
      this.saveMigrationLog();
      
      // 7. 验证结果
      const verified = this.verifyMigration(images);
      
      console.log('\n🎉 迁移完成！');
      console.log(`📊 总计: ${images.length} 张图片`);
      console.log(`✅ 成功: ${result.successCount} 张`);
      console.log(`❌ 失败: ${result.errorCount} 张`);
      console.log(`🔍 验证: ${verified ? '通过' : '失败'}`);
      
      if (verified && result.errorCount === 0) {
        console.log('\n✨ 迁移成功！现在可以安全删除旧目录结构。');
      } else {
        console.log('\n⚠️  迁移过程中有错误，请检查日志后再删除旧文件。');
      }
      
    } catch (error) {
      console.log('❌ 迁移过程中发生错误:', error.message);
      console.log('📋 请查看备份和日志文件进行恢复');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const migrator = new ImageMigrator();
  migrator.run();
}

module.exports = ImageMigrator;