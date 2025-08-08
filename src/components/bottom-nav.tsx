import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Home, Upload, User } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { key: "home", to: "/gallery", label: "主页", icon: Home },
  { key: "upload", to: "/upload", label: "上传", icon: Upload },
  { key: "profile", to: "/gallery", label: "我的", icon: User }, // 占位
]

export default function BottomNav() {
  const nav = useNavigate()
  const loc = useLocation()

  // 在移动设备上隐藏底部导航栏
  return (
    <nav className="hidden" role="navigation" aria-label="底部导航">
      <ul className="mx-auto max-w-2xl grid grid-cols-3">
        {items.map((it) => {
          const active = loc.pathname === it.to || (it.key === "home" && loc.pathname.startsWith("/gallery"))
          const Icon = it.icon
          return (
            <li key={it.key}>
              <button
                className={cn(
                  "w-full py-2.5 flex flex-col items-center justify-center gap-1",
                  active ? "text-gray-900" : "text-gray-500"
                )}
                onClick={() => nav(it.to)}
                aria-current={active ? "page" : undefined}
                aria-label={it.label}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px]">{it.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}