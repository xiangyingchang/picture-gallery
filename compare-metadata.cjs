const fs = require('fs');
const https = require('https');

// 获取线上元数据
function getOnlineMetadata() {
  return new Promise((resolve, reject) => {
    https.get('https://xiangyingchang.github.io/picture-gallery/gallery-metadata.json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function compareMetadata() {
  try {
    console.log('=== 获取线上和本地元数据 ===');
    
    const localMetadata = JSON.parse(fs.readFileSync('public/gallery-metadata.json', 'utf8'));
    const onlineMetadata = await getOnlineMetadata();
    
    console.log('本地图片数量:', localMetadata.count);
    console.log('线上图片数量:', onlineMetadata.count);
    console.log('本地生成时间:', localMetadata.generated);
    console.log('线上生成时间:', onlineMetadata.generated);
    
    if (localMetadata.count !== onlineMetadata.count) {
      console.log('\n❌ 发现数量不一致！');
      console.log('差异:', localMetadata.count - onlineMetadata.count, '张图片');
      
      // 找出差异的图片
      const localIds = new Set(localMetadata.images.map(img => img.id));
      const onlineIds = new Set(onlineMetadata.images.map(img => img.id));
      
      const missingInOnline = localMetadata.images.filter(img => !onlineIds.has(img.id));
      const extraInOnline = onlineMetadata.images.filter(img => !localIds.has(img.id));
      
      if (missingInOnline.length > 0) {
        console.log('\n📋 线上缺失的图片:');
        missingInOnline.forEach(img => {
          console.log(`- ${img.filename} (ID: ${img.id})`);
          console.log(`  路径: ${img.path}`);
          console.log(`  创建时间: ${img.created}`);
        });
      }
      
      if (extraInOnline.length > 0) {
        console.log('\n📋 线上多出的图片:');
        extraInOnline.forEach(img => {
          console.log(`+ ${img.filename} (ID: ${img.id})`);
        });
      }
      
      console.log('\n🔧 解决方案:');
      console.log('1. 线上的元数据文件过期了，需要触发GitHub Actions重新生成');
      console.log('2. 或者手动推送最新的元数据文件到GitHub');
      
    } else {
      console.log('\n✅ 数量一致，问题可能在前端渲染逻辑');
    }
    
  } catch (error) {
    console.error('❌ 比较失败:', error.message);
  }
}

compareMetadata();