import crypto from 'crypto';
import { Logger } from '../utils/logger.js';

export class WebhookHandler {
  constructor(config) {
    this.config = config;
    this.logger = new Logger('WebhookHandler');
  }

  /**
   * 处理GitHub Webhook
   */
  handle = async (req, res) => {
    try {
      // 验证webhook签名
      if (this.config.secret && !this.verifySignature(req)) {
        this.logger.warn('Webhook签名验证失败');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const event = req.headers['x-github-event'];
      const payload = req.body;

      this.logger.info(`收到GitHub Webhook: ${event}`);

      // 处理push事件
      if (event === 'push') {
        await this.handlePushEvent(payload);
      }

      res.status(200).json({ message: 'Webhook processed successfully' });

    } catch (error) {
      this.logger.error('Webhook处理失败:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * 验证webhook签名
   */
  verifySignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
      return false;
    }

    const body = JSON.stringify(req.body);
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', this.config.secret)
      .update(body, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * 处理push事件
   */
  async handlePushEvent(payload) {
    const { ref, commits, repository } = payload;
    
    // 只处理主分支的推送
    if (ref !== 'refs/heads/main' && ref !== 'refs/heads/master') {
      this.logger.info(`忽略非主分支推送: ${ref}`);
      return;
    }

    this.logger.info(`处理主分支推送: ${commits.length} 个提交`);

    // 检查是否有图片相关的变更
    const hasImageChanges = commits.some(commit => 
      commit.added.some(file => this.isImageFile(file)) ||
      commit.modified.some(file => this.isImageFile(file)) ||
      commit.removed.some(file => this.isImageFile(file))
    );

    if (hasImageChanges) {
      this.logger.info('检测到图片变更，触发同步');
      
      // 触发同步服务
      if (this.config.syncService) {
        try {
          await this.config.syncService.performSync();
        } catch (error) {
          this.logger.error('Webhook触发同步失败:', error);
        }
      }
    } else {
      this.logger.info('未检测到图片变更');
    }
  }

  /**
   * 检查是否为图片文件
   */
  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => 
      filename.toLowerCase().endsWith(ext)
    );
  }
}

export default WebhookHandler;