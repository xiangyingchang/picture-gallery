import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { validateCredentials, generateSessionToken, validateSessionToken, getSessionExpiry } from "@/utils/auth-utils"
import { secureSetItem, secureGetItem, secureRemoveItem } from "@/utils/crypto-utils"

type User = {
  id: string
  email: string
}

type AuthContextType = {
  isAuthed: boolean
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = "auth_session_secure"
const USER_KEY = "auth_user_secure"
const EXPIRY_KEY = "auth_expiry_secure"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // 检查安全存储的认证状态
    const token = secureGetItem<string>(TOKEN_KEY)
    const userStr = secureGetItem<string>(USER_KEY)
    const expiry = secureGetItem<number>(EXPIRY_KEY)
    
    if (token && userStr && expiry && Date.now() < expiry && validateSessionToken(token)) {
      try {
        setUser(JSON.parse(userStr))
      } catch {
        // 如果解析失败，清除所有认证信息
        logout()
      }
    } else {
      // 会话过期或无效，清除认证信息
      logout()
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600)) // mock delay
    
    // 使用安全的凭证验证
    if (!validateCredentials(email, password)) {
      setLoading(false)
      throw new Error("用户名或密码错误")
    }
    
    // 生成安全的会话令牌
    const sessionToken = generateSessionToken()
    const expiry = getSessionExpiry()
    const mockUser: User = { id: "admin", email: email }
    
    // 使用加密存储
    secureSetItem(TOKEN_KEY, sessionToken)
    secureSetItem(USER_KEY, JSON.stringify(mockUser))
    secureSetItem(EXPIRY_KEY, expiry)
    
    setUser(mockUser)
    setLoading(false)
  }

  const logout = () => {
    // 安全清除所有认证信息
    secureRemoveItem(TOKEN_KEY)
    secureRemoveItem(USER_KEY)
    secureRemoveItem(EXPIRY_KEY)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      isAuthed: !!user,
      user,
      loading,
      login,
      logout,
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}