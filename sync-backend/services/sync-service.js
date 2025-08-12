import { EventEmitter } from 'events';
import axios from 'axios';
import { Logger } from '../utils/logger.js';

export class SyncService extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = {
      checkInterval: 30000, // 30秒
      maxRetries: 3,
      timeout: 10000,
      ...config
    };
    
    this.logger = new Logger('SyncService');
    this.isRunning = false;
    this.intervalId = null;
    this.currentVersion = null;
    this.lastSyncTime = null;
    this.retryCount = 0;
    
    // 统计信息
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastError: null,
      averageResponseTime: 0,
      responseTimes: []
    };
  }

  /**
   * 启动同步服务
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn('同步服务已在运行');
      return;
    }

    this.isRunning = true;
    this.logger.info('启动自动同步服务...');

    try {
      // 立即执行一次同步检查
      await this.performSync();
      
      // 设置定时检查
      this.intervalId = setInterval(async () => {
        try {
          await this.performSync();
        } catch (error) {
          this.logger.error('定时同步失败:', error);
        }
      }, this.config.checkInterval);

      this.logger.info(`自动同步服务已启动，检查间隔: ${this.config.checkInterval}ms`);
      
    } catch (error) {
      this.isRunning = false;
      this.logger.error('同步服务启动失败:', error);
      throw error;
    }
  }

  /**
   * 停止同步服务
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.logger.info('自动同步服务已停止');
  }

  /**
   * 执行同步检查
   */
  async performSync() {
    const startTime = Date.now();
    
    try {
      this.emit('sync_start', {
        timestamp: new Date().toISOString(),
        version: this.currentVersion
      });

      this.logger.info('开始同步检查...');

      // 1. 检查GitHub仓库最新提交
      const latestCommit = await this.getLatestCommit();
      
      if (!latestCommit) {
        throw new Error('无法获取远程仓库信息');
      }

      // 2. 检查是否有更新
      const hasUpdate = this.currentVersion !== latestCommit.sha;
      
      if (!hasUpdate) {
        this.logger.info('没有发现新的更新');
        this.emit('sync_complete', {
          hasUpdate: false,
          version: this.currentVersion,
          message: '没有发现新的更新'
        });
        return { hasUpdate: false };
      }

      this.logger.info(`发现新版本: ${latestCommit.sha.substring(0, 8)}`);

      // 3. 获取最新的图片元数据
      const metadata = await this.fetchGalleryMetadata();
      
      if (!metadata || !metadata.images) {
        throw new Error('获取图片元数据失败');
      }

      // 4. 计算差异
      const diff = await this.calculateDiff(metadata);
      
      // 5. 更新版本信息
      const oldVersion = this.currentVersion;
      this.currentVersion = latestCommit.sha;
      this.lastSyncTime = new Date().toISOString();

      // 6. 记录统计信息
      const responseTime = Date.now() - startTime;
      this.updateStats(true, responseTime);

      // 7. 发送同步完成事件
      const result = {
        hasUpdate: true,
        oldVersion,
        newVersion: this.currentVersion,
        diff,
        metadata: {
          totalImages: metadata.images.length,
          lastModified: metadata.generated || new Date().toISOString()
        },
        responseTime
      };

      this.emit('sync_complete', result);

      // 8. 如果有新图片，发送新图片事件
      if (diff.added.length > 0) {
        this.emit('new_images', {
          count: diff.added.length,
          images: diff.added,
          totalImages: metadata.images.length
        });
      }

      this.logger.info(`同步完成: 新增${diff.added.length}张, 更新${diff.updated.length}张, 删除${diff.deleted.length}张`);
      
      this.retryCount = 0; // 重置重试计数
      return result;

    } catch (error) {
      this.updateStats(false, Date.now() - startTime, error);
      this.handleSyncError(error);
      throw error;
    }
  }

  /**
   * 获取GitHub仓库最新提交
   */
  async getLatestCommit() {
    const url = `https://api.github.com/repos/${this.config.githubOwner}/${this.config.githubRepo}/commits/main`;
    
    this.logger.info(`请求GitHub API: ${url}`);
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Gallery-Sync-Service/1.0'
    };

    if (this.config.githubToken) {
      headers['Authorization'] = `token ${this.config.githubToken}`;
    }

    try {
      const response = await axios.get(url, {
        headers,
        timeout: this.config.timeout
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        this.logger.warn('GitHub API速率限制，使用备用方法');
        return await this.getLatestCommitFallback();
      }
      throw new Error(`GitHub API请求失败: ${error.message}`);
    }
  }

  /**
   * 备用方法获取最新提交（不使用API）
   */
  async getLatestCommitFallback() {
    try {
      // 通过获取元数据文件的最后修改时间来判断更新
      const metadataUrl = `https://raw.githubusercontent.com/${this.config.githubOwner}/${this.config.githubRepo}/main/public/gallery-metadata.json`;
      
      const response = await axios.head(metadataUrl, {
        timeout: this.config.timeout
      });

      const lastModified = response.headers['last-modified'];
      const etag = response.headers['etag'];
      
      return {
        sha: etag || new Date(lastModified).getTime().toString(),
        commit: {
          committer: {
            date: lastModified || new Date().toISOString()
          }
        }
      };
    } catch (error) {
      throw new Error(`备用方法获取提交信息失败: ${error.message}`);
    }
  }

  /**
   * 获取画廊元数据
   */
  async fetchGalleryMetadata() {
    const metadataUrl = `https://raw.githubusercontent.com/${this.config.githubOwner}/${this.config.githubRepo}/main/public/gallery-metadata.json`;
    
    try {
      const response = await axios.get(metadataUrl, {
        timeout: this.config.timeout,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`获取元数据失败: ${error.message}`);
    }
  }

  /**
   * 计算数据差异
   */
  async calculateDiff(newMetadata) {
    const diff = {
      added: [],
      updated: [],
      deleted: [],
      metadata: {}
    };

    try {
      // 如果是第一次同步，所有图片都是新增的
      if (!this.lastMetadata) {
        diff.added = newMetadata.images || [];
        this.lastMetadata = newMetadata;
        return diff;
      }

      const oldImages = new Map((this.lastMetadata.images || []).map(img => [img.id, img]));
      const newImages = new Map((newMetadata.images || []).map(img => [img.id, img]));

      // 找出新增的图片
      for (const [id, image] of newImages) {
        if (!oldImages.has(id)) {
          diff.added.push(image);
        } else {
          // 检查是否有更新
          const oldImage = oldImages.get(id);
          if (JSON.stringify(oldImage) !== JSON.stringify(image)) {
            diff.updated.push(image);
          }
        }
      }

      // 找出删除的图片
      for (const [id, image] of oldImages) {
        if (!newImages.has(id)) {
          diff.deleted.push(image);
        }
      }

      // 元数据变更
      if (this.lastMetadata.count !== newMetadata.count) {
        diff.metadata.count = {
          old: this.lastMetadata.count,
          new: newMetadata.count
        };
      }

      this.lastMetadata = newMetadata;
      return diff;

    } catch (error) {
      this.logger.error('计算差异失败:', error);
      return diff;
    }
  }

  /**
   * 处理同步错误
   */
  handleSyncError(error) {
    this.retryCount++;
    
    this.logger.error(`同步失败 (${this.retryCount}/${this.config.maxRetries}):`, error);
    
    this.emit('sync_error', {
      error: error.message,
      retryCount: this.retryCount,
      maxRetries: this.config.maxRetries,
      willRetry: this.retryCount < this.config.maxRetries
    });

    if (this.retryCount < this.config.maxRetries) {
      const delay = Math.pow(2, this.retryCount) * 1000; // 指数退避
      this.logger.info(`${delay}ms后重试...`);
      
      setTimeout(async () => {
        try {
          await this.performSync();
        } catch (retryError) {
          this.logger.error('重试同步失败:', retryError);
        }
      }, delay);
    } else {
      this.logger.error('达到最大重试次数，停止重试');
      this.retryCount = 0;
    }
  }

  /**
   * 更新统计信息
   */
  updateStats(success, responseTime, error = null) {
    this.stats.totalSyncs++;
    
    if (success) {
      this.stats.successfulSyncs++;
    } else {
      this.stats.failedSyncs++;
      this.stats.lastError = error?.message || 'Unknown error';
    }

    // 更新响应时间统计
    this.stats.responseTimes.push(responseTime);
    if (this.stats.responseTimes.length > 100) {
      this.stats.responseTimes = this.stats.responseTimes.slice(-100);
    }
    
    this.stats.averageResponseTime = this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentVersion: this.currentVersion,
      lastSyncTime: this.lastSyncTime,
      retryCount: this.retryCount,
      config: {
        checkInterval: this.config.checkInterval,
        maxRetries: this.config.maxRetries,
        githubOwner: this.config.githubOwner,
        githubRepo: this.config.githubRepo
      },
      stats: {
        ...this.stats,
        successRate: this.stats.totalSyncs > 0 
          ? ((this.stats.successfulSyncs / this.stats.totalSyncs) * 100).toFixed(2) + '%'
          : '0%'
      }
    };
  }

  /**
   * 手动触发同步
   */
  async manualSync() {
    this.logger.info('手动触发同步');
    return await this.performSync();
  }
}

export default SyncService;