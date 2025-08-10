import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CheckCircle2, AlertTriangle, FileX, Github } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getGitHubService, initGitHubService } from "@/services/github-api"
import GitHubConfigComponent from "@/components/github-config"

type QItem = {
  id: string
  file: File
  url: string
  progress: number
  status: "queued" | "uploading" | "done" | "error" | "unsupported"
  errorMessage?: string
}

export default function UploadPage() {
  const { toast } = useToast()
  const [queue, setQueue] = React.useState<QItem[]>([])
  const [dragOver, setDragOver] = React.useState(false)
  const [running, setRunning] = React.useState(false)
  const [githubConfigured, setGithubConfigured] = React.useState(false)

  const inputRef = React.useRef<HTMLInputElement>(null)

  // 检查 GitHub 配置状态
  React.useEffect(() => {
    const savedConfig = localStorage.getItem('github-config')
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        initGitHubService(config) // 初始化 GitHub 服务
        setGithubConfigured(true)
      } catch (error) {
        console.error('解析 GitHub 配置失败:', error)
        setGithubConfigured(false)
      }
    } else {
      setGithubConfigured(false)
    }
  }, [])

  // 检测HEIF格式文件
  const isHeifFormat = (file: File): boolean => {
    const name = file.name.toLowerCase()
    const type = file.type.toLowerCase()
    return name.endsWith('.heic') || name.endsWith('.heif') || 
           type.includes('heif') || type.includes('heic')
  }

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    let supportedCount = 0
    let unsupportedCount = 0
    
    const list: QItem[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i))
      .map((f) => {
        const isHeif = isHeifFormat(f)
        if (isHeif) {
          unsupportedCount++
          return {
            id: "q_" + Math.random().toString(36).slice(2, 9),
            file: f,
            url: URL.createObjectURL(f),
            progress: 0,
            status: "unsupported" as const,
            errorMessage: "HEIF/HEIC格式暂不支持，请转换为JPG/PNG格式"
          }
        } else {
          supportedCount++
          return {
            id: "q_" + Math.random().toString(36).slice(2, 9),
            file: f,
            url: URL.createObjectURL(f),
            progress: 0,
            status: "queued" as const,
          }
        }
      })
    
    setQueue((prev) => [...prev, ...list])
    
    if (list.length > 0) {
      let message = `已添加 ${list.length} 个文件`
      if (unsupportedCount > 0) {
        message += `，其中 ${unsupportedCount} 个HEIF格式文件不支持`
      }
      toast({ 
        title: message,
        variant: unsupportedCount > 0 ? "destructive" : "default"
      })
    }
  }

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }
  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    setDragOver(true)
  }
  const onDragLeave: React.DragEventHandler<HTMLDivElement> = () => setDragOver(false)

  const startOne = async (item: QItem) => {
    if (item.status === "unsupported") {
      return // 跳过不支持的格式
    }

    setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "uploading", progress: 0 } : q)))
    
    try {
      // GitHub 上传模式
      const githubService = getGitHubService()
      if (!githubService) {
        throw new Error('GitHub 服务未配置')
      }

      const result = await githubService.uploadFile(item.file, (progress) => {
        setQueue((prev) => prev.map((q) => 
          q.id === item.id ? { ...q, progress } : q
        ))
      })

      if (result.success) {
        setQueue((prev) => prev.map((q) => 
          q.id === item.id ? { ...q, progress: 100, status: "done" } : q
        ))
        
        toast({
          title: "上传成功",
          description: `${item.file.name} 已上传到 GitHub`
        })

        // 触发 GitHub Actions 重新生成元数据
        await githubService.triggerWorkflow()
      } else {
        throw new Error(result.message)
      }
      
    } catch (error) {
      console.error('上传失败:', error)
      setQueue((prev) => prev.map((q) => 
        q.id === item.id ? { 
          ...q, 
          status: "error", 
          errorMessage: error instanceof Error ? error.message : '上传失败'
        } : q
      ))
      
      toast({
        title: "上传失败",
        description: `${item.file.name}: ${error instanceof Error ? error.message : '未知错误'}`,
        variant: "destructive"
      })
    }
  }

  const queueRef = React.useRef<QItem[]>([])
  React.useEffect(() => {
    queueRef.current = queue
  }, [queue])

  const handleStartAll = async () => {
    setRunning(true)
    
    const uploadableItems = queueRef.current.filter(item => 
      item.status === "queued"
    )
    
    let successCount = 0
    let errorCount = 0
    
    // 顺序上传每个文件
    for (const item of uploadableItems) {
      try {
        await startOne(item)
        successCount++
      } catch (error) {
        errorCount++
      }
    }
    
    setRunning(false)
    
    // 显示上传结果
    if (successCount > 0) {
      toast({ 
        title: "上传完成", 
        description: `成功上传 ${successCount} 张图片${errorCount > 0 ? `，${errorCount} 张失败` : ''}` 
      })
    } else if (errorCount > 0) {
      toast({ 
        title: "上传失败", 
        description: `${errorCount} 张图片上传失败`,
        variant: "destructive"
      })
    }
  }

  const renderUploadInterface = () => {
    return (
      <>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          role="button"
          aria-label="拖拽上传区域"
          className={[
            "relative w-full rounded-xl border-2 border-dashed p-10 text-center transition-colors",
            dragOver ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300",
          ].join(" ")}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => addFiles(e.target.files)}
          />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-500" />
            <p className="text-sm text-gray-600">拖拽图片到此，或点击选择文件</p>
            <p className="text-xs text-gray-400">支持常见图片格式</p>
          </div>
        </div>

        {/* HEIF格式警告 */}
        {queue.some(q => q.status === "unsupported") && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              检测到HEIF/HEIC格式文件，当前不支持此格式。请使用以下方法转换：
              <br />• iPhone用户：设置 → 相机 → 格式 → 选择"最兼容"
              <br />• 或使用在线转换工具将HEIF转换为JPG格式
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Button 
            onClick={handleStartAll} 
            disabled={queue.filter(q => q.status === "queued").length === 0 || running}
            className="bg-black hover:bg-gray-800 text-white px-8"
          >
            <Upload className="h-4 w-4 mr-1" /> 
            开始上传 ({queue.filter(q => q.status === "queued").length})
          </Button>
        </div>

        <div aria-live="polite" className="space-y-3">
          {queue.length === 0 && <p className="text-sm text-gray-500">当前队列为空</p>}
          {queue.map((q) => (
            <div key={q.id} className={`flex items-center gap-3 rounded-lg border p-3 ${
              q.status === "unsupported" ? "border-orange-200 bg-orange-50" : 
              q.status === "error" ? "border-red-200 bg-red-50" : ""
            }`}>
              <div className="h-14 w-14 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                {q.status === "unsupported" ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <FileX className="h-6 w-6 text-orange-500" />
                  </div>
                ) : (
                  <img 
                    src={q.url} 
                    alt={q.file.name} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.error('Upload preview image failed to load:', q.url)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm text-gray-800">{q.file.name}</p>
                  <span className="shrink-0 text-xs text-gray-500">{(q.file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                {q.status !== "unsupported" && (
                  <div className="mt-2">
                    <Progress value={q.progress} className="h-2" />
                  </div>
                )}
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className={
                    q.status === "unsupported" ? "text-orange-600" :
                    q.status === "error" ? "text-red-600" :
                    q.status === "done" ? "text-green-600" : "text-gray-500"
                  }>
                    {q.status === "queued" && "待上传"}
                    {q.status === "uploading" && "上传中"}
                    {q.status === "done" && "已完成"}
                    {q.status === "error" && "上传失败"}
                    {q.status === "unsupported" && "格式不支持"}
                  </span>
                  {q.errorMessage && (
                    <span className="text-red-500">· {q.errorMessage}</span>
                  )}
                  {q.status === "queued" && (
                    <span className="text-gray-400">
                      · 目标路径：public/uploads/{new Date().getFullYear()}/{String(new Date().getMonth() + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {q.status === "done" && <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-label="已完成" />}
                {q.status === "error" && <AlertTriangle className="h-5 w-5 text-red-500" aria-label="失败" />}
                {q.status === "unsupported" && <FileX className="h-5 w-5 text-orange-500" aria-label="不支持" />}
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        {!githubConfigured ? (
          <GitHubConfigComponent onConfigured={setGithubConfigured} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub 直传上传
              </CardTitle>
              <CardDescription>
                直接上传到 GitHub 仓库，自动触发部署。目标路径：public/uploads/YYYY/MM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  GitHub 配置已就绪。上传的图片将直接保存到仓库，并自动触发 GitHub Actions 重新生成元数据。
                </AlertDescription>
              </Alert>
              {renderUploadInterface()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}