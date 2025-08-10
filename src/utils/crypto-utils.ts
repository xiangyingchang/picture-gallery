/**
 * 加密工具函数
 * 用于敏感数据的本地加密存储
 */

import CryptoJS from 'crypto-js'

// 加密密钥（实际项目中应该从环境变量获取）
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'gallery_encryption_key_2024'

/**
 * 加密数据
 */
export function encryptData(data: string): string {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
  } catch (error) {
    console.error('数据加密失败:', error)
    return data
  }
}

/**
 * 解密数据
 */
export function decryptData(encryptedData: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('数据解密失败:', error)
    return encryptedData
  }
}

/**
 * 安全存储到 localStorage
 */
export function secureSetItem(key: string, value: any): void {
  try {
    const jsonString = JSON.stringify(value)
    const encrypted = encryptData(jsonString)
    localStorage.setItem(key, encrypted)
  } catch (error) {
    console.error('安全存储失败:', error)
  }
}

/**
 * 从 localStorage 安全读取
 */
export function secureGetItem<T>(key: string): T | null {
  try {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null
    
    const decrypted = decryptData(encrypted)
    return JSON.parse(decrypted) as T
  } catch (error) {
    console.error('安全读取失败:', error)
    return null
  }
}

/**
 * 安全删除
 */
export function secureRemoveItem(key: string): void {
  localStorage.removeItem(key)
}