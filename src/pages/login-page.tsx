import React, { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const nav = useNavigate()
  const loc = useLocation() as any
  const { login, loading } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email.trim(), password)
      toast({ title: "登录成功" })
      const to = loc.state?.from?.pathname || "/"
      nav(to, { replace: true })
    } catch (err: any) {
      setError(err?.message || "登录失败")
      toast({ title: "登录失败", description: err?.message || "请稍后重试", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-dvh bg-white flex items-center justify-center px-4">
      <Card className="w-full max-w-sm shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">登录到 三三の头像库</CardTitle>
          <CardDescription>请输入管理员账号密码以继续</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">用户名</Label>
              <Input
                id="email"
                type="text"
                placeholder="三三"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-invalid={!!error && !email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-invalid={!!error && !password}
                />
                <Button type="button" variant="outline" onClick={() => setShowPwd((s) => !s)} aria-label="切换显示密码">
                  {showPwd ? "隐藏" : "显示"}
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              登录后可进行图片上传和管理操作
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}