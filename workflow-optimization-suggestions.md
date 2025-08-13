# GitHub Actions工作流优化建议

## 问题：GitHub Pages缓存延迟导致图片数量不一致

### 当前问题
- 本地：147张 ✅
- GitHub仓库：147张 ✅  
- GitHub Pages：146张 ❌ (已修复)

### 优化方案

#### 1. 添加缓存破坏机制
在元数据中添加版本号和时间戳，强制刷新缓存：

```javascript
// 在 scripts/generate-metadata.js 中
const metadata = {
  generated: new Date().toISOString(),
  count: images.length,
  version: Date.now(), // 添加版本号
  cacheBuster: Math.random().toString(36), // 缓存破坏器
  images: processedImages
}
```

#### 2. 优化工作流依赖关系
修改 `.github/workflows/smart-gallery-update.yml`：

```yaml
# 确保部署在元数据生成后进行
- name: Wait for metadata generation
  run: sleep 10

- name: Verify metadata integrity
  run: |
    EXPECTED_COUNT=$(find public/uploads -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | wc -l)
    METADATA_COUNT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('public/gallery-metadata.json')).count)")
    
    if [ "$EXPECTED_COUNT" != "$METADATA_COUNT" ]; then
      echo "❌ 元数据不一致: 期望 $EXPECTED_COUNT, 实际 $METADATA_COUNT"
      exit 1
    fi
    echo "✅ 元数据验证通过: $METADATA_COUNT 张图片"
```

#### 3. 添加部署后验证
```yaml
- name: Verify deployment
  run: |
    sleep 30 # 等待CDN刷新
    ONLINE_COUNT=$(curl -s "https://xiangyingchang.github.io/picture-gallery/gallery-metadata.json" | node -e "let d=''; process.stdin.on('data', c => d+=c); process.stdin.on('end', () => console.log(JSON.parse(d).count))")
    LOCAL_COUNT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('public/gallery-metadata.json')).count)")
    
    if [ "$ONLINE_COUNT" != "$LOCAL_COUNT" ]; then
      echo "⚠️ 部署验证失败，可能需要等待CDN刷新"
    else
      echo "✅ 部署验证成功"
    fi
```

#### 4. 分离工作流职责
- `smart-gallery-update.yml`: 只负责扫描和生成元数据
- `deploy.yml`: 只负责构建和部署
- 通过 `workflow_run` 事件确保顺序执行

### 监控建议

#### 1. 添加健康检查端点
在前端添加一个健康检查页面，显示：
- 本地元数据版本
- 线上元数据版本  
- 图片数量对比
- 最后更新时间

#### 2. 自动告警机制
如果检测到不一致，自动创建GitHub Issue或发送通知。

### 用户操作建议

#### 上传图片后的最佳实践：
1. 上传图片到 `public/uploads/`
2. 推送到GitHub
3. 等待5-10分钟让GitHub Actions完成
4. 检查线上是否正确显示
5. 如有问题，手动触发工作流重新部署

#### 快速修复命令：
```bash
# 如果发现不一致，快速触发重新部署
git commit --allow-empty -m "🔄 触发重新部署"
git push origin main