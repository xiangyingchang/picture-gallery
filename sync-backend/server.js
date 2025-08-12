import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { SyncService } from './services/sync-service.js';
import { WebhookHandler } from './services/webhook-handler.js';
import { Logger } from './utils/logger.js';
import { validateEnv } from './utils/validation.js';

// 加载环境变量
dotenv.config();

// 验证环境变量
validateEnv();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5180",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3001;
const logger = new Logger();

// 中间件
app.use(helmet({
  contentSecurityPolicy: false // 开发环境下禁用CSP
}));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5180",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// 初始化服务
const syncService = new SyncService({
  githubOwner: process.env.GITHUB_OWNER || 'muskxiang',
  githubRepo: process.env.GITHUB_REPO || 'Picture',
  githubToken: process.env.GITHUB_TOKEN,
  checkInterval: parseInt(process.env.CHECK_INTERVAL) || 30000,
  maxRetries: parseInt(process.env.MAX_RETRIES) || 3
});

const webhookHandler = new WebhookHandler({
  secret: process.env.WEBHOOK_SECRET,
  syncService
});

// 连接状态管理
const connectedClients = new Map();
let syncStats = {
  totalConnections: 0,
  activeConnections: 0,
  lastSyncTime: null,
  syncCount: 0,
  errorCount: 0
};

// WebSocket连接处理
io.on('connection', (socket) => {
  const clientId = socket.id;
  const clientInfo = {
    id: clientId,
    connectedAt: new Date(),
    lastActivity: new Date(),
    userAgent: socket.handshake.headers['user-agent'],
    ip: socket.handshake.address
  };

  connectedClients.set(clientId, clientInfo);
  syncStats.totalConnections++;
  syncStats.activeConnections = connectedClients.size;

  logger.info(`客户端连接: ${clientId}`, {
    totalConnections: syncStats.totalConnections,
    activeConnections: syncStats.activeConnections
  });

  // 发送欢迎消息和当前状态
  socket.emit('connected', {
    clientId,
    serverTime: new Date().toISOString(),
    stats: syncStats
  });

  // 发送当前同步状态
  socket.emit('sync_status', {
    status: syncService.getStatus(),
    stats: syncStats
  });

  // 心跳处理
  socket.on('heartbeat', (data) => {
    connectedClients.get(clientId).lastActivity = new Date();
    socket.emit('heartbeat', {
      serverTime: new Date().toISOString(),
      clientTime: data?.clientTime
    });
  });

  // 手动同步请求
  socket.on('manual_sync', async (data) => {
    try {
      logger.info(`客户端 ${clientId} 请求手动同步`);
      
      socket.emit('sync_start', {
        type: 'manual',
        timestamp: new Date().toISOString()
      });

      const result = await syncService.performSync();
      
      // 广播同步结果给所有客户端
      io.emit('sync_complete', {
        type: 'manual',
        result,
        timestamp: new Date().toISOString(),
        triggeredBy: clientId
      });

      syncStats.syncCount++;
      syncStats.lastSyncTime = new Date().toISOString();

    } catch (error) {
      logger.error('手动同步失败:', error);
      
      socket.emit('sync_error', {
        type: 'manual',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      syncStats.errorCount++;
    }
  });

  // 获取统计信息
  socket.on('get_stats', () => {
    socket.emit('stats_update', {
      ...syncStats,
      connectedClients: Array.from(connectedClients.values()).map(client => ({
        id: client.id,
        connectedAt: client.connectedAt,
        lastActivity: client.lastActivity
      }))
    });
  });

  // 断开连接处理
  socket.on('disconnect', (reason) => {
    connectedClients.delete(clientId);
    syncStats.activeConnections = connectedClients.size;

    logger.info(`客户端断开: ${clientId}`, {
      reason,
      activeConnections: syncStats.activeConnections
    });
  });

  // 错误处理
  socket.on('error', (error) => {
    logger.error(`WebSocket错误 (${clientId}):`, error);
  });
});

// 同步服务事件监听
syncService.on('sync_start', (data) => {
  logger.info('开始自动同步检查');
  io.emit('sync_start', {
    type: 'auto',
    ...data,
    timestamp: new Date().toISOString()
  });
});

syncService.on('sync_progress', (data) => {
  io.emit('sync_progress', {
    ...data,
    timestamp: new Date().toISOString()
  });
});

syncService.on('sync_complete', (data) => {
  logger.info('自动同步完成', data);
  io.emit('sync_complete', {
    type: 'auto',
    ...data,
    timestamp: new Date().toISOString()
  });
  
  syncStats.syncCount++;
  syncStats.lastSyncTime = new Date().toISOString();
});

syncService.on('sync_error', (error) => {
  logger.error('自动同步失败:', error);
  io.emit('sync_error', {
    type: 'auto',
    error: error.message,
    timestamp: new Date().toISOString()
  });
  
  syncStats.errorCount++;
});

syncService.on('new_images', (data) => {
  logger.info(`发现新图片: ${data.count}张`);
  io.emit('new_images', {
    ...data,
    timestamp: new Date().toISOString()
  });
});

// REST API 路由
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    stats: syncStats
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    sync: syncService.getStatus(),
    server: {
      uptime: process.uptime(),
      connections: syncStats.activeConnections,
      stats: syncStats
    },
    timestamp: new Date().toISOString()
  });
});

app.post('/api/sync', async (req, res) => {
  try {
    const result = await syncService.performSync();
    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('API同步请求失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GitHub Webhook处理
app.post('/api/webhook/github', webhookHandler.handle.bind(webhookHandler));

// 获取图片数据API
app.get('/api/images', async (req, res) => {
  try {
    const metadata = await syncService.fetchGalleryMetadata();
    res.json(metadata.images || []);
  } catch (error) {
    logger.error('获取图片数据失败:', error);
    res.status(500).json({
      error: 'Failed to fetch images',
      message: error.message
    });
  }
});

// 获取完整元数据API
app.get('/api/metadata', async (req, res) => {
  try {
    const metadata = await syncService.fetchGalleryMetadata();
    res.json(metadata);
  } catch (error) {
    logger.error('获取元数据失败:', error);
    res.status(500).json({
      error: 'Failed to fetch metadata',
      message: error.message
    });
  }
});

// 获取连接的客户端信息
app.get('/api/clients', (req, res) => {
  const clients = Array.from(connectedClients.values()).map(client => ({
    id: client.id,
    connectedAt: client.connectedAt,
    lastActivity: client.lastActivity,
    userAgent: client.userAgent,
    ip: client.ip
  }));

  res.json({
    clients,
    count: clients.length,
    stats: syncStats
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  logger.error('服务器错误:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `路径 ${req.path} 不存在`
  });
});

// 定时任务 - 清理非活跃连接
cron.schedule('*/5 * * * *', () => {
  const now = new Date();
  const timeout = 5 * 60 * 1000; // 5分钟超时

  for (const [clientId, client] of connectedClients) {
    if (now - client.lastActivity > timeout) {
      logger.info(`清理非活跃连接: ${clientId}`);
      connectedClients.delete(clientId);
      syncStats.activeConnections = connectedClients.size;
    }
  }
});

// 启动服务器
server.listen(PORT, () => {
  logger.info(`🚀 Gallery Sync Backend 启动成功`);
  logger.info(`📡 WebSocket服务运行在: ws://localhost:${PORT}`);
  logger.info(`🌐 HTTP API服务运行在: http://localhost:${PORT}`);
  logger.info(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  
  // 启动同步服务
  syncService.start().catch(error => {
    logger.error('同步服务启动失败:', error);
  });
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，开始优雅关闭...');
  
  syncService.stop();
  
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，开始优雅关闭...');
  
  syncService.stop();
  
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

export default app;