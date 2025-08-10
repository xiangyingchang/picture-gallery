const crypto = require('crypto');

// 生成密码哈希的函数（与 auth-utils.ts 中的逻辑一致）
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'gallery_salt_2024').digest('hex');
}

// 为您当前的密码生成正确的哈希值
const passwords = [
  'sansan',
  'Sansan19951003.',
  'admin123',
  'mySecurePass2024'
];

console.log('🔒 === 密码哈希生成器 ===\n');

passwords.forEach(password => {
  const hash = hashPassword(password);
  console.log(`密码: "${password}"`);
  console.log(`哈希: ${hash}\n`);
});

console.log('📋 使用方法：');
console.log('1. 选择一个密码');
console.log('2. 复制对应的哈希值');
console.log('3. 将哈希值粘贴到 .env 文件的 VITE_ADMIN_PASSWORD_HASH 中');
console.log('\n⚠️  重要：请立即删除此文件，避免密码泄露！');