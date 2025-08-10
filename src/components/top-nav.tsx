import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { LogOut, Upload, LogIn, User } from "lucide-react"

export default function TopNav() {
  const nav = useNavigate()
  const loc = useLocation()
  const { user, logout, isAuthed } = useAuth()

  const onLogout = () => {
    logout()
    nav("/", { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
        <button
          className="font-semibold tracking-tight text-gray-900"
          aria-label="返回首页"
          onClick={() => nav("/")}
        >
          三三の头像库
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* 只有登录后才显示上传按钮 */}
          {isAuthed && loc.pathname !== "/upload" && (
            <Button 
              variant="ghost" 
              className="border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 gap-2 transition-all duration-200 ease-in-out" 
              onClick={() => nav("/upload")}
            >
              <Upload className="h-4 w-4" />
              上传
            </Button>
          )}

          {/* 根据登录状态显示不同的用户菜单 */}
          {isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  aria-label="账户菜单"
                  className="relative group focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-full transition-all duration-200"
                >
                  <Avatar className="h-10 w-10 border border-gray-200 group-hover:border-gray-300 transition-all duration-200 group-hover:shadow-md">
                    <AvatarFallback className="bg-gray-100 group-hover:bg-gray-200 text-gray-600 transition-all duration-200">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 mt-2">
                <DropdownMenuLabel>
                  {user?.email ?? "未登录"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" className="gap-2" onClick={() => nav("/login")}>
              <LogIn className="h-4 w-4" />
              登录
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
