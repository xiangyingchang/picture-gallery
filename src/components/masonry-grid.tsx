import ImageCard from "./image-card"
import type { ImageItem } from "@/store/gallery-store"

type MasonryGridProps = {
  items: ImageItem[]
  onItemClick?: (item: ImageItem) => void
  className?: string
  isEditMode?: boolean
  selectedImages?: string[]
  onImageSelect?: (id: string) => void
  onEnterEditMode?: () => void
}

export default function MasonryGrid({ 
  items, 
  onItemClick, 
  className, 
  isEditMode = false, 
  selectedImages = [], 
  onImageSelect,
  onEnterEditMode
}: MasonryGridProps) {
  return (
    <section
      aria-label="瀑布流图片列表"
      className={["columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-3 [column-fill:_balance]", className].filter(Boolean).join(" ")}
    >
        {items.map((it) => (
          <div key={it.id} className="mb-3 break-inside-avoid">
            <ImageCard 
              item={it} 
              onClick={() => onItemClick?.(it)}
              isEditMode={isEditMode}
              isSelected={selectedImages.includes(it.id)}
              onSelect={onImageSelect}
              onEnterEditMode={onEnterEditMode}
            />
          </div>
        ))}
    </section>
  )
}