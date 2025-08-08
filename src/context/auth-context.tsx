import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

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

const TOKEN_KEY = "auth_token_mock"
const USER_KEY = "auth_user_mock"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const userStr = localStorage.getItem(USER_KEY)
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch {
        setUser(null)
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600)) // mock delay
    
    // 固定凭证验证：用户名"三三"，密码"sansan"
    if (email !== "三三" || password !== "sansan") {
      setLoading(false)
      throw new Error("用户名或密码错误")
    }
    
    const mockUser: User = { id: "sansan", email: "三三" }
    localStorage.setItem(TOKEN_KEY, "mock-token")
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
    setUser(mockUser)
    setLoading(false)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
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