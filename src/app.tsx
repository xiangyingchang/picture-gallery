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
  return (
    <AuthProvider>
      <GalleryProvider>
      <Shell>
        <Routes>
          <Route path="/" element={<Navigate to="/gallery" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/gallery"
            element={<GalleryPage />}
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
          <Route path="*" element={<Navigate to="/gallery" replace />} />
        </Routes>
      </Shell>
      </GalleryProvider>
    </AuthProvider>
  )
}
