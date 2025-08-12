import Joi from 'joi';

/**
 * 验证环境变量
 */
export function validateEnv() {
  const schema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().port().default(3001),
    FRONTEND_URL: Joi.string().uri().default('http://localhost:5180'),
    GITHUB_OWNER: Joi.string().required(),
    GITHUB_REPO: Joi.string().required(),
    GITHUB_TOKEN: Joi.string().optional(),
    WEBHOOK_SECRET: Joi.string().optional(),
    CHECK_INTERVAL: Joi.number().min(5000).default(30000),
    MAX_RETRIES: Joi.number().min(1).max(10).default(3),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info')
  });

  const { error, value } = schema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: false
  });

  if (error) {
    throw new Error(`环境变量验证失败: ${error.details.map(d => d.message).join(', ')}`);
  }

  // 将验证后的值写回环境变量
  Object.assign(process.env, value);
  
  console.log('✅ 环境变量验证通过');
  return value;
}

/**
 * 验证同步请求参数
 */
export function validateSyncRequest(data) {
  const schema = Joi.object({
    force: Joi.boolean().default(false),
    timeout: Joi.number().min(1000).max(60000).default(10000)
  });

  const { error, value } = schema.validate(data);
  
  if (error) {
    throw new Error(`同步请求参数验证失败: ${error.details.map(d => d.message).join(', ')}`);
  }

  return value;
}

/**
 * 验证WebSocket消息
 */
export function validateWebSocketMessage(data) {
  const schema = Joi.object({
    type: Joi.string().valid('heartbeat', 'manual_sync', 'get_stats').required(),
    data: Joi.any().optional(),
    timestamp: Joi.string().isoDate().optional()
  });

  const { error, value } = schema.validate(data);
  
  if (error) {
    throw new Error(`WebSocket消息验证失败: ${error.details.map(d => d.message).join(', ')}`);
  }

  return value;
}

export default {
  validateEnv,
  validateSyncRequest,
  validateWebSocketMessage
};