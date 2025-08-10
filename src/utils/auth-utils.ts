/**
 * 认证工具函数
 * 提供安全的密码验证和会话管理
 */

import CryptoJS from 'crypto-js'

// 从环境变量获取配置，如果没有则使用安全的默认值
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || '三三'
const ADMIN_PASSWORD_HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH || '2bbf669bed5460f8da92489d1622894558e71893ca45df6496f0be1eea415a7d'

/**
 * 生成密码哈希
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password + 'gallery_salt_2024').toString()
}

/**
 * 验证登录凭据
 */
export function validateCredentials(username: string, password: string): boolean {
  const inputPasswordHash = hashPassword(password)
  return username === ADMIN_USERNAME && inputPasswordHash === ADMIN_PASSWORD_HASH
}

/**
 * 生成安全的会话令牌
 */
export function generateSessionToken(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  return CryptoJS.SHA256(`${timestamp}_${random}_gallery_session`).toString()
}

/**
 * 验证会话令牌
 */
export function validateSessionToken(token: string): boolean {
  // 简单的令牌验证，实际项目中应该有更复杂的验证逻辑
  return !!(token && token.length === 64 && /^[a-f0-9]+$/.test(token))
}

/**
 * 获取会话过期时间（24小时）
 */
export function getSessionExpiry(): number {
  return Date.now() + 24 * 60 * 60 * 1000
}