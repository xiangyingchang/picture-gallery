import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Settings, CheckCircle2, AlertTriangle, Eye, EyeOff, Shield } from 'lucide-react'
import { initGitHubService, type GitHubConfig } from '@/services/github-api'
import { secureSetItem, secureGetItem, secureRemoveItem } from '@/utils/crypto-utils'

interface GitHubConfigProps {
  onConfigured?: (configured: boolean) => void
}

const GITHUB_CONFIG_KEY = 'github_config_secure'

export default function GitHubConfigComponent({ onConfigured }: GitHubConfigProps) {
  const [config, setConfig] = useState<GitHubConfig>({
    owner: '',
    repo: '',
    token: '',
    branch: 'main'
  })
  
  const [showToken, setShowToken] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // 从加密存储加载配置
  useEffect(() => {
    const savedConfig = secureGetItem<GitHubConfig>(GITHUB_CONFIG_KEY)
    if (savedConfig && savedConfig.owner && savedConfig.repo && savedConfig.token) {
      setConfig(savedConfig)
      initGitHubService(savedConfig)
      setIsConfigured(true)
      onConfigured?.(true)
    } else {
      // 尝试从环境变量加载（如果有的话）
      const envConfig: GitHubConfig = {
        owner: import.meta.env.VITE_GITHUB_OWNER || '',
        repo: import.meta.env.VITE_GITHUB_REPO || '',
        token: import.meta.env.VITE_GITHUB_TOKEN || '',
        branch: import.meta.env.VITE_GITHUB_BRANCH || 'main'
      }
      
      if (envConfig.owner && envConfig.repo && envConfig.token) {
        setConfig(envConfig)
        initGitHubService(envConfig)
        setIsConfigured(true)
        onConfigured?.(true)
      } else {
        setIsConfigured(false)
        onConfigured?.(false)
      }
    }
  }, [onConfigured])

  // 保存配置到加密存储
  const saveConfig = () => {
    if (!config.owner || !config.repo || !config.token) {
      setTestResult({ success: false, message: '请填写所有必填字段' })
      return
    }

    try {
      // 使用加密存储保存敏感配置
      secureSetItem(GITHUB_CONFIG_KEY, config)
      initGitHubService(config)
      setIsConfigured(true)
      onConfigured?.(true)
      setTestResult({ success: true, message: '配置已安全保存（已加密）' })
    } catch (error) {
      setTestResult({ success: false, message: '保存配置失败' })
    }
  }

  // 测试 GitHub API 连接
  const testConnection = async () => {
    if (!config.owner || !config.repo || !config.token) {
      setTestResult({ success: false, message: '请先填写完整配置' })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      // 测试 API 连接
      const response = await fetch(
        `https://api.github.com/repos/${config.owner}/${config.repo}`,
        {
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (response.ok) {
        const repoData = await response.json()
        setTestResult({ 
          success: true, 
          message: `连接成功！仓库: ${repoData.full_name}` 
        })
      } else {
        const errorData = await response.json()
        setTestResult({ 
          success: false, 
          message: `连接失败: ${errorData.message || response.statusText}` 
        })
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}` 
      })
    } finally {
      setIsTesting(false)
    }
  }

  // 清除配置
  const clearConfig = () => {
    secureRemoveItem(GITHUB_CONFIG_KEY)
    setConfig({ owner: '', repo: '', token: '', branch: 'main' })
    setIsConfigured(false)
    setTestResult(null)
    onConfigured?.(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              GitHub 配置
              <Shield className="h-4 w-4 text-green-600" />
            </CardTitle>
            <CardDescription>
              配置 GitHub API 以支持直接上传图片到仓库（数据将被加密存储）
            </CardDescription>
          </div>
          {isConfigured && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              已配置
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>🔒 隐私保护：</strong>您的 GitHub Token 和配置信息将使用 AES 加密算法安全存储在本地，不会以明文形式保存。
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="owner">GitHub 用户名 *</Label>
            <Input
              id="owner"
              placeholder="例如: xiangyingchang"
              value={config.owner}
              onChange={(e) => setConfig(prev => ({ ...prev, owner: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="repo">仓库名 *</Label>
            <Input
              id="repo"
              placeholder="例如: picture-gallery"
              value={config.repo}
              onChange={(e) => setConfig(prev => ({ ...prev, repo: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="token">Personal Access Token * 🔒</Label>
          <div className="relative">
            <Input
              id="token"
              type={showToken ? "text" : "password"}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={config.token}
              onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="branch">分支名</Label>
          <Input
            id="branch"
            placeholder="main"
            value={config.branch}
            onChange={(e) => setConfig(prev => ({ ...prev, branch: e.target.value || 'main' }))}
          />
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>如何获取 Personal Access Token：</strong>
            <br />1. 访问 GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
            <br />2. 点击 "Generate new token (classic)"
            <br />3. 选择权限：<code>repo</code> (完整仓库访问权限)
            <br />4. 复制生成的 token 并粘贴到上方输入框
          </AlertDescription>
        </Alert>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={testConnection} 
            disabled={isTesting}
            variant="outline"
          >
            {isTesting ? '测试中...' : '测试连接'}
          </Button>
          
          <Button 
            onClick={saveConfig}
            disabled={!config.owner || !config.repo || !config.token}
          >
            🔒 安全保存
          </Button>
          
          {isConfigured && (
            <Button 
              onClick={clearConfig}
              variant="destructive"
            >
              清除配置
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}