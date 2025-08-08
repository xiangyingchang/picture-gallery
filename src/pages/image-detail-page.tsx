import React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useGallery } from "@/store/gallery-store"
import { Button } from "@/components/ui/button"
import MasonryGrid from "@/components/masonry-grid"
import { ArrowLeft, Download, MoreHorizontal } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { getAssetPath } from "@/utils/path-utils"

export default function ImageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { getById, images } = useGallery()
  const item = id ? getById(id) : undefined

  if (!item) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => nav(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> 返回
          </Button>
          <span className="text-sm text-gray-500">图片不存在或尚未加载</span>
        </div>
      </div>
    )
  }

  const related = images.filter((x) => x.id !== item.id).slice(0, 8)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => nav(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 返回
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            下载（占位）
          </Button>
          <Button variant="ghost" size="icon" aria-label="更多">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="relative overflow-hidden rounded-xl border bg-white">
            <img
              src={item.src} // 已经在 gallery-store.tsx 中处理过路径
              alt={item.title || "图片"}
              className="w-full h-auto object-contain bg-gray-50"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">提示：双击/滚轮缩放为占位交互，后续可接入高级查看器</p>
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-medium text-gray-900">图片信息</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between"><span>文件名</span><span className="truncate max-w-[60%] text-right">{item.title || "-"}</span></div>
              <div className="flex justify-between"><span>创建时间</span><span>{new Date(item.createdAt).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>存储目录</span><span>{item.folderPath}</span></div>
              {typeof item.size === "number" && (
                <div className="flex justify-between"><span>大小</span><span>{(item.size / 1024 / 1024).toFixed(2)} MB</span></div>
              )}
            </div>
          </div>
          <Separator className="my-6" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">更多图片</h3>
            <div className="mt-3">
              <MasonryGrid items={related} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}