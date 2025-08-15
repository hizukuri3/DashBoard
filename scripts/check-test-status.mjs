#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🔍 Checking Playwright test status...');

try {
  // Playwrightプロセスの確認
  const playwrightProcesses = execSync('ps aux | grep playwright | grep -v grep', { encoding: 'utf8' });
  
  if (playwrightProcesses.trim()) {
    console.log('🔄 Playwright tests are currently running:');
    console.log(playwrightProcesses);
  } else {
    console.log('✅ No Playwright tests are currently running');
  }
  
  // 開発サーバーの確認
  try {
    const devServerProcesses = execSync('lsof -i :3000', { encoding: 'utf8' });
    console.log('\n🌐 Development server status:');
    console.log(devServerProcesses);
  } catch (e) {
    console.log('\n🌐 Development server: Not running on port 3000');
  }
  
} catch (error) {
  if (error.status === 1) {
    console.log('✅ No Playwright tests are currently running');
  } else {
    console.error('❌ Error checking test status:', error.message);
  }
}

console.log('\n📊 Status check completed');
