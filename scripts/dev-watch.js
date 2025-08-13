#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 启动开发环境 + 图片监控...');

// 启动 Vite 开发服务器
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// 启动图片监控
const watchProcess = spawn('node', ['scripts/watch-gallery.js'], {
  stdio: 'inherit',
  shell: true
});

// 优雅退出处理
process.on('SIGINT', () => {
  console.log('\n🛑 正在停止所有服务...');
  viteProcess.kill('SIGINT');
  watchProcess.kill('SIGINT');
  process.exit(0);
});

viteProcess.on('exit', (code) => {
  console.log(`Vite 进程退出，代码: ${code}`);
  watchProcess.kill('SIGINT');
  process.exit(code);
});

watchProcess.on('exit', (code) => {
  console.log(`监控进程退出，代码: ${code}`);
});