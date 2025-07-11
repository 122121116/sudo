#!/usr/bin/env node

/**
 * 测试运行脚本
 * 运行项目的功能测试
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 开始运行数独游戏功能测试...\n');

try {
  // 运行测试
  const testCommand = 'npm test';
  console.log(`执行命令: ${testCommand}`);
  
  execSync(testCommand, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ 所有测试通过！');
  
} catch (error) {
  console.error('\n❌ 测试失败:', error.message);
  process.exit(1);
} 