#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🧪 Starting Playwright tests...');

// テスト実行状態の監視
function monitorTestStatus() {
  return new Promise((resolve, reject) => {
    const testProcess = spawn('npx', ['playwright', 'test', 'tests/visual/', '--project=chromium', '--timeout=10000'], {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    let output = '';
    
    testProcess.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      
      // 進捗状況を表示
      if (message.includes('Running')) {
        console.log('🔄 Tests are running...');
      } else if (message.includes('passed')) {
        console.log('✅ Tests passed!');
      } else if (message.includes('failed')) {
        console.log('❌ Tests failed!');
      } else if (message.includes('Serving HTML report')) {
        console.log('📊 Test report generated');
      }
    });

    testProcess.stderr.on('data', (data) => {
      console.error(`Test Error: ${data}`);
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Tests completed successfully');
        resolve({ success: true, output });
      } else {
        console.log(`❌ Tests failed with exit code ${code}`);
        resolve({ success: false, output, exitCode: code });
      }
    });

    testProcess.on('error', (error) => {
      console.error(`Test execution error: ${error.message}`);
      reject(error);
    });
  });
}

// メイン実行
async function runTests() {
  try {
    const result = await monitorTestStatus();
    console.log(`\n📋 Test Summary:`);
    console.log(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    if (result.exitCode !== undefined) {
      console.log(`Exit Code: ${result.exitCode}`);
    }
  } catch (error) {
    console.log('❌ Tests failed or timed out');
  } finally {
    console.log('\n🧹 Cleaning up Playwright processes...');
    
    try {
      // Playwrightプロセスをクリーンアップ
      execSync('pkill -f playwright', { stdio: 'ignore' });
      console.log('✅ Playwright processes cleaned up');
    } catch (cleanupError) {
      console.log('ℹ️  No Playwright processes to clean up');
    }
    
    try {
      // 開発サーバープロセスもクリーンアップ（必要に応じて）
      execSync('pkill -f "npm run dev"', { stdio: 'ignore' });
      console.log('✅ Development server processes cleaned up');
    } catch (cleanupError) {
      console.log('ℹ️  No development server processes to clean up');
    }
    
    console.log('🎯 Test execution completed');
  }
}

runTests();
