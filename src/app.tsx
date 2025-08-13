import React from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import LoginPage from "./pages/login-page"
import GalleryPage from "./pages/gallery-page"
import UploadPage from "./pages/upload-page"
import ImageDetailPage from "./pages/image-detail-page"
import TopNav from "./components/top-nav"
import BottomNav from "./components/bottom-nav"
import { AuthProvider, useAuth } from "./context/auth-context"
import { GalleryProvider } from "./store/gallery-store"
import { initGitHubService } from "./services/github-api"
import { secureGetItem } from "./utils/crypto-utils"

function Shell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isLogin = location.pathname.startsWith("/login")
  return (
    <div className="min-h-dvh flex flex-col">
      {!isLogin && <TopNav />}
      <main className="flex-1">{children}</main>
      {!isLogin && <BottomNav />}
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthed } = useAuth()
  const location = useLocation()
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <>{children}</>
}

export default function App() {
  // 在应用启动时初始化GitHub服务
  React.useEffect(() => {
    const initializeGitHubService = () => {
      // 首先尝试从加密存储读取配置
      const savedConfig = secureGetItem('github_config_secure')
      if (savedConfig && savedConfig.owner && savedConfig.repo && savedConfig.token) {
        console.log('🔧 从加密存储初始化GitHub服务')
        initGitHubService(savedConfig)
        return
      }

      // 如果没有保存的配置，尝试从环境变量读取
      const envConfig = {
        owner: import.meta.env.VITE_GITHUB_OWNER || '',
        repo: import.meta.env.VITE_GITHUB_REPO || '',
        token: import.meta.env.VITE_GITHUB_TOKEN || '',
        branch: import.meta.env.VITE_GITHUB_BRANCH || 'main'
      }

      if (envConfig.owner && envConfig.repo && envConfig.token) {
        console.log('🔧 从环境变量初始化GitHub服务')
        initGitHubService(envConfig)
      } else {
        console.log('⚠️ 未找到GitHub配置，需要手动配置')
      }
    }

    initializeGitHubService()
  }, [])

  return (
    <AuthProvider>
      <GalleryProvider>
      <Shell>
        <Routes>
          <Route path="/" element={<GalleryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/gallery"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="/upload"
            element={
              <RequireAuth>
                <UploadPage />
              </RequireAuth>
            }
          />
          <Route
            path="/image/:id"
            element={
              <RequireAuth>
                <ImageDetailPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
      </GalleryProvider>
    </AuthProvider>
  )
}
