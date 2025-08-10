/**
 * GitHub API 服务
 * 用于直接上传图片到 GitHub 仓库
 */

export interface GitHubConfig {
  owner: string // GitHub 用户名
  repo: string  // 仓库名
  token: string // GitHub Personal Access Token
  branch?: string // 分支名，默认 main
}

export interface UploadResult {
  success: boolean
  message: string
  filename?: string
  path?: string
  sha?: string
  downloadUrl?: string
}

export class GitHubApiService {
  private config: GitHubConfig
  private baseUrl = 'https://api.github.com'

  constructor(config: GitHubConfig) {
    this.config = {
      ...config,
      branch: config.branch || 'main'
    }
  }

  /**
   * 将文件转换为 Base64 编码
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // 移除 data:image/jpeg;base64, 前缀
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * 生成唯一的文件名
   */
  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const ext = originalName.split('.').pop()
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
    
    // 如果文件名已经很独特，保持原名
    if (originalName.match(/^(IMG_|mmexport|[a-f0-9]{32})/)) {
      return originalName
    }
    
    return `${nameWithoutExt}_${timestamp}_${random}.${ext}`
  }

  /**
   * 获取当前年月路径
   */
  private getCurrentPath(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `public/uploads/${year}/${month}`
  }

  /**
   * 检查文件是否已存在
   */
  private async checkFileExists(path: string): Promise<{ exists: boolean; sha?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        return { exists: true, sha: data.sha }
      }
      
      return { exists: false }
    } catch (error) {
      console.error('检查文件存在性失败:', error)
      return { exists: false }
    }
  }

  /**
   * 上传单个文件到 GitHub
   */
  async uploadFile(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      onProgress?.(10)

      // 生成文件路径
      const basePath = this.getCurrentPath()
      const filename = this.generateUniqueFilename(file.name)
      const filePath = `${basePath}/${filename}`

      onProgress?.(20)

      // 检查文件是否已存在
      const { exists, sha } = await this.checkFileExists(filePath)
      if (exists) {
        return {
          success: false,
          message: '文件已存在'
        }
      }

      onProgress?.(40)

      // 转换文件为 Base64
      const base64Content = await this.fileToBase64(file)
      
      onProgress?.(60)

      // 上传到 GitHub
      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `📸 上传图片: ${filename}`,
            content: base64Content,
            branch: this.config.branch,
            ...(sha && { sha }) // 如果文件存在，需要提供 SHA
          }),
        }
      )

      onProgress?.(80)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      
      onProgress?.(100)

      return {
        success: true,
        message: '上传成功',
        filename,
        path: filePath,
        sha: result.content.sha,
        downloadUrl: result.content.download_url
      }

    } catch (error) {
      console.error('GitHub 上传失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '上传失败'
      }
    }
  }

  /**
   * 批量上传文件
   */
  async uploadFiles(
    files: File[],
    onProgress?: (fileIndex: number, fileProgress: number, totalProgress: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      const result = await this.uploadFile(file, (progress) => {
        const totalProgress = ((i * 100 + progress) / files.length)
        onProgress?.(i, progress, totalProgress)
      })
      
      results.push(result)
    }
    
    return results
  }

  /**
   * 触发 GitHub Actions 工作流（重新生成元数据）
   */
  async triggerWorkflow(workflowId: string = 'smart-gallery-update.yml'): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/actions/workflows/${workflowId}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: this.config.branch
          }),
        }
      )

      return response.ok
    } catch (error) {
      console.error('触发工作流失败:', error)
      return false
    }
  }
}

// 导出一个默认实例（需要配置）
let githubService: GitHubApiService | null = null

export function initGitHubService(config: GitHubConfig) {
  githubService = new GitHubApiService(config)
  return githubService
}

export function getGitHubService(): GitHubApiService | null {
  return githubService
}