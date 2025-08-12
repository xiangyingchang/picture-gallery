import winston from 'winston';

export class Logger {
  constructor(service = 'App') {
    this.service = service;
    
    // 创建winston logger实例
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp, service, ...meta }) => {
          let log = `${timestamp} [${level.toUpperCase()}] [${service || this.service}] ${message}`;
          
          // 添加额外的元数据
          if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
          }
          
          return log;
        })
      ),
      defaultMeta: { service: this.service },
      transports: [
        // 控制台输出
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        
        // 文件输出 - 所有日志
        new winston.transports.File({
          filename: 'logs/app.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        
        // 文件输出 - 错误日志
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });

    // 在生产环境中移除控制台输出
    if (process.env.NODE_ENV === 'production') {
      this.logger.remove(this.logger.transports[0]);
    }
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }
}

export default Logger;