#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { scanImageDirectory, updateGalleryStore, validateUpdate, generateReport } = require('./update-gallery');

/**
 * 图片目录监听器
 * 功能：监听图片目录变化，自动触发更新流程
 */

// 配置
const CONFIG = {
  IMAGES_DIR: path.join(__dirname, '../public/uploads/2025/08'),
  LOG_FILE: path.join(__dirname, '../logs/watcher.log'),
  DEBOUNCE_DELAY: 2000 // 防抖延迟（毫秒）
};

let updateTimeout = null;

/**
 * 日志记录函数
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [WATCHER] [${level}] ${message}`;
  
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
 * 防抖处理更新
 */
function debounceUpdate() {
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  
  updateTimeout = setTimeout(async () => {
    log('触发自动更新流程...');
    await performUpdate();
  }, CONFIG.DEBOUNCE_DELAY);
}

/**
 * 执行更新流程
 */
async function performUpdate() {
  try {
    log('开始执行自动更新...');
    
    // 1. 扫描图片目录
    const imageFiles = scanImageDirectory();
    
    if (imageFiles.length === 0) {
      log('未发现有效图片文件', 'WARN');
      return;
    }
    
    // 2. 更新 gallery-store.tsx
    const updateSuccess = updateGalleryStore(imageFiles);
    
    if (!updateSuccess) {
      log('自动更新失败', 'ERROR');
      return;
    }
    
    // 3. 验证更新结果
    const validationSuccess = validateUpdate();
    
    if (!validationSuccess) {
      log('验证失败', 'ERROR');
      return;
    }
    
    // 4. 生成处理报告
    const report = generateReport(imageFiles, updateSuccess);
    
    log(`自动更新完成: ${report.totalImages} 张图片`);
    
    // 5. 可选：自动提交到 Git（如果需要）
    if (process.env.AUTO_COMMIT === 'true') {
      await autoCommitChanges(report);
    }
    
  } catch (error) {
    log(`自动更新失败: ${error.message}`, 'ERROR');
  }
}

/**
 * 自动提交更改到 Git
 */
async function autoCommitChanges(report) {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  try {
    log('开始自动提交更改...');
    
    // 检查是否有更改
    const { stdout: status } = await execAsync('git status --porcelain');
    if (!status.trim()) {
      log('没有需要提交的更改');
      return;
    }
    
    // 添加更改
    await execAsync('git add src/store/gallery-store.tsx');
    
    // 提交更改
    const commitMessage = `feat: 自动更新图片库 (${report.totalImages} 张图片)

- 自动扫描并更新图片列表
- 更新时间: ${report.timestamp}
- 处理的图片格式: ${[...new Set(report.images.map(img => img.format))].join(', ')}

[自动提交]`;
    
    await execAsync(`git commit -m "${commitMessage}"`);
    log('自动提交完成');
    
    // 可选：自动推送（需要配置）
    if (process.env.AUTO_PUSH === 'true') {
      await execAsync('git push origin main');
      log('自动推送完成');
    }
    
  } catch (error) {
    log(`自动提交失败: ${error.message}`, 'ERROR');
  }
}

/**
 * 启动文件监听器
 */
function startWatcher() {
  log('启动图片目录监听器...');
  log(`监听目录: ${CONFIG.IMAGES_DIR}`);
  
  // 确保监听目录存在
  if (!fs.existsSync(CONFIG.IMAGES_DIR)) {
    log(`创建监听目录: ${CONFIG.IMAGES_DIR}`);
    fs.mkdirSync(CONFIG.IMAGES_DIR, { recursive: true });
  }
  
  // 创建监听器
  const watcher = chokidar.watch(CONFIG.IMAGES_DIR, {
    ignored: /(^|[\/\\])\../, // 忽略隐藏文件
    persistent: true,
    ignoreInitial: false
  });
  
  // 监听事件
  watcher
    .on('add', (filePath) => {
      const filename = path.basename(filePath);
      log(`检测到新文件: ${filename}`);
      debounceUpdate();
    })
    .on('unlink', (filePath) => {
      const filename = path.basename(filePath);
      log(`检测到文件删除: ${filename}`);
      debounceUpdate();
    })
    .on('change', (filePath) => {
      const filename = path.basename(filePath);
      log(`检测到文件修改: ${filename}`);
      debounceUpdate();
    })
    .on('error', (error) => {
      log(`监听器错误: ${error.message}`, 'ERROR');
    })
    .on('ready', () => {
      log('监听器就绪，开始监听文件变化...');
      // 启动时执行一次初始更新
      debounceUpdate();
    });
  
  // 优雅关闭处理
  process.on('SIGINT', () => {
    log('收到关闭信号，正在关闭监听器...');
    watcher.close().then(() => {
      log('监听器已关闭');
      process.exit(0);
    });
  });
  
  return watcher;
}

/**
 * 主函数
 */
function main() {
  log('=== 启动图片目录自动监听服务 ===');
  
  // 显示配置信息
  log(`监听目录: ${CONFIG.IMAGES_DIR}`);
  log(`防抖延迟: ${CONFIG.DEBOUNCE_DELAY}ms`);
  log(`自动提交: ${process.env.AUTO_COMMIT === 'true' ? '启用' : '禁用'}`);
  log(`自动推送: ${process.env.AUTO_PUSH === 'true' ? '启用' : '禁用'}`);
  
  // 启动监听器
  startWatcher();
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  startWatcher,
  performUpdate,
  autoCommitChanges
};