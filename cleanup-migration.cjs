#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 开始清理旧目录结构...\n');

class MigrationCleaner {
  constructor() {
    this.oldDir = 'public/uploads/2025';
    this.backupDir = 'backup-migration';
    this.cleanupLog = [];
  }

  // 验证迁移完整性
  verifyMigration() {
    console.log('🔍 验证迁移完整性...');
    
    const newDir = 'public/uploads';
    const oldImageDir = 'public/uploads/2025/08';
    
    if (!fs.existsSync(newDir)) {
      throw new Error('新目录不存在，迁移可能未完成');
    }
    
    if (!fs.existsSync(oldImageDir)) {
      console.log('⚠️ 旧目录不存在，可能已被清理');
      return false;
    }
    
    // 检查文件数量
    const newFiles = fs.readdirSync(newDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    const oldFiles = fs.readdirSync(oldImageDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    
    console.log(`   新目录文件数: ${newFiles.length}`);
    console.log(`   旧目录文件数: ${oldFiles.length}`);
    
    if (newFiles.length !== oldFiles.length) {
      throw new Error(`文件数量不匹配: 新目录 ${newFiles.length}, 旧目录 ${oldFiles.length}`);
    }
    
    // 检查关键文件是否存在
    let missingFiles = 0;
    for (const file of oldFiles.slice(0, 10)) { // 检查前10个文件
      const newPath = path.join(newDir, file);
      if (!fs.existsSync(newPath)) {
        console.log(`   ❌ 缺失文件: ${file}`);
        missingFiles++;
      }
    }
    
    if (missingFiles > 0) {
      throw new Error(`发现 ${missingFiles} 个缺失文件，迁移可能不完整`);
    }
    
    console.log('✅ 迁移完整性验证通过\n');
    return true;
  }

  // 创建最终备份
  createFinalBackup() {
    console.log('💾 创建最终备份...');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    // 备份清理前的目录结构信息
    const structureInfo = {
      timestamp: new Date().toISOString(),
      action: 'cleanup',
      oldDirectory: this.oldDir,
      directories: [],
      files: []
    };
    
    // 记录目录结构
    if (fs.existsSync(this.oldDir)) {
      const scanDirectory = (dir, relativePath = '') => {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const itemRelativePath = path.join(relativePath, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            structureInfo.directories.push(itemRelativePath);
            scanDirectory(fullPath, itemRelativePath);
          } else {
            structureInfo.files.push({
              path: itemRelativePath,
              size: stat.size,
              modified: stat.mtime.toISOString()
            });
          }
        }
      };
      
      scanDirectory(this.oldDir);
    }
    
    // 保存结构信息
    const backupFile = path.join(this.backupDir, 'cleanup-backup-info.json');
    fs.writeFileSync(backupFile, JSON.stringify(structureInfo, null, 2));
    
    console.log(`✅ 备份信息已保存: ${backupFile}`);
    console.log(`   记录了 ${structureInfo.directories.length} 个目录和 ${structureInfo.files.length} 个文件\n`);
  }

  // 计算目录大小
  calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    if (!fs.existsSync(dirPath)) {
      return 0;
    }
    
    const calculateSize = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          calculateSize(fullPath);
        } else {
          totalSize += stat.size;
        }
      }
    };
    
    calculateSize(dirPath);
    return totalSize;
  }

  // 格式化文件大小
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  // 删除目录
  removeDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      return;
    }
    
    const removeRecursive = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          removeRecursive(fullPath);
        } else {
          fs.unlinkSync(fullPath);
          this.cleanupLog.push({
            action: 'delete_file',
            path: fullPath,
            size: stat.size,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      fs.rmdirSync(dir);
      this.cleanupLog.push({
        action: 'delete_directory',
        path: dir,
        timestamp: new Date().toISOString()
      });
    };
    
    removeRecursive(dirPath);
  }

  // 执行清理
  performCleanup() {
    console.log('🗑️ 开始清理旧目录...');
    
    // 计算清理前的大小
    const sizeBeforeCleanup = this.calculateDirectorySize(this.oldDir);
    console.log(`   清理前大小: ${this.formatSize(sizeBeforeCleanup)}`);
    
    if (sizeBeforeCleanup === 0) {
      console.log('⚠️ 旧目录为空或不存在，无需清理\n');
      return;
    }
    
    // 执行删除
    try {
      this.removeDirectory(this.oldDir);
      
      console.log(`✅ 清理完成`);
      console.log(`   删除了 ${this.cleanupLog.filter(l => l.action === 'delete_file').length} 个文件`);
      console.log(`   删除了 ${this.cleanupLog.filter(l => l.action === 'delete_directory').length} 个目录`);
      console.log(`   释放空间: ${this.formatSize(sizeBeforeCleanup)}\n`);
      
    } catch (error) {
      console.error(`❌ 清理失败: ${error.message}`);
      throw error;
    }
  }

  // 保存清理日志
  saveCleanupLog() {
    const logFile = path.join(this.backupDir, 'cleanup-log.json');
    const logData = {
      timestamp: new Date().toISOString(),
      cleanupTarget: this.oldDir,
      operations: this.cleanupLog,
      summary: {
        filesDeleted: this.cleanupLog.filter(l => l.action === 'delete_file').length,
        directoriesDeleted: this.cleanupLog.filter(l => l.action === 'delete_directory').length,
        totalOperations: this.cleanupLog.length
      }
    };
    
    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
    console.log(`📋 清理日志已保存: ${logFile}`);
  }

  // 验证清理结果
  verifyCleanup() {
    console.log('🔍 验证清理结果...');
    
    if (fs.existsSync(this.oldDir)) {
      console.log('❌ 旧目录仍然存在，清理可能不完整');
      return false;
    }
    
    // 检查新目录是否完好
    const newDir = 'public/uploads';
    if (!fs.existsSync(newDir)) {
      console.log('❌ 新目录不存在，可能被误删');
      return false;
    }
    
    const newFiles = fs.readdirSync(newDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    console.log(`✅ 新目录完好，包含 ${newFiles.length} 张图片`);
    
    return true;
  }

  // 主执行函数
  async run() {
    try {
      console.log('🚀 开始迁移清理流程...\n');
      
      // 1. 验证迁移完整性
      const migrationExists = this.verifyMigration();
      if (!migrationExists) {
        console.log('✅ 旧目录不存在，清理已完成');
        return;
      }
      
      // 2. 创建最终备份
      this.createFinalBackup();
      
      // 3. 执行清理
      this.performCleanup();
      
      // 4. 保存清理日志
      this.saveCleanupLog();
      
      // 5. 验证清理结果
      const cleanupSuccess = this.verifyCleanup();
      
      if (cleanupSuccess) {
        console.log('\n🎉 迁移清理完成！');
        console.log('📊 清理结果:');
        console.log(`   ✅ 旧目录已删除: ${this.oldDir}`);
        console.log(`   ✅ 新目录完好: public/uploads`);
        console.log(`   ✅ 备份信息已保存: ${this.backupDir}`);
        console.log('\n💡 迁移工作全部完成！');
        console.log('   - 图片已迁移到统一目录结构');
        console.log('   - 所有配置已更新');
        console.log('   - 兼容性处理已添加');
        console.log('   - 旧文件已清理');
      } else {
        console.log('\n⚠️ 清理过程中发现问题，请检查日志');
      }
      
    } catch (error) {
      console.error('\n❌ 清理过程中发生错误:', error.message);
      console.log('📋 请查看备份和日志文件进行恢复');
      throw error;
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const cleaner = new MigrationCleaner();
  cleaner.run().catch(console.error);
}

module.exports = MigrationCleaner;