#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

class TestMonitor {
  constructor() {
    this.isRunning = false;
    this.startTime = null;
    this.endTime = null;
    this.status = 'idle'; // idle, running, completed, failed
    this.testProcess = null;
    this.lastProcessCheck = null;
  }

  // テストの実際の状態を監視（プロセスベースではなく）
  async checkTestStatus() {
    try {
      // 1. プロセスチェック（補助的な情報）
      const processInfo = await this.checkPlaywrightProcesses();
      
      // 2. テストレポートの存在チェック（より確実）
      const reportExists = await this.checkTestReport();
      
      // 3. テストの出力ログチェック（最も確実）
      const logInfo = await this.checkTestLogs();
      
      return {
        processExists: processInfo.exists,
        processCount: processInfo.count,
        reportExists,
        logInfo,
        // テスト完了の判定：レポートが存在し、ログが完了を示している
        isCompleted: reportExists && logInfo.isCompleted
      };
    } catch (error) {
      console.error('Error checking test status:', error.message);
      return {
        processExists: false,
        processCount: 0,
        reportExists: false,
        logInfo: { isCompleted: false },
        isCompleted: false
      };
    }
  }

  // プロセスチェック（補助的な情報）
  async checkPlaywrightProcesses() {
    try {
      const result = execSync('ps aux | grep playwright | grep -v grep', { encoding: 'utf8' });
      
      if (result.trim()) {
        const lines = result.trim().split('\n').filter(line => line.trim());
        
        // 監視スクリプト自身とその関連プロセスを除外
        const filteredLines = lines.filter(line => {
          return !line.includes('node scripts') && 
                 !line.includes('smart-test-monitor') &&
                 !line.includes('check-test-status') &&
                 !line.includes('run-tests-clean');
        });
        
        return {
          exists: filteredLines.length > 0,
          count: filteredLines.length,
          processes: filteredLines
        };
      } else {
        return {
          exists: false,
          count: 0,
          processes: []
        };
      }
    } catch (error) {
      if (error.status === 1) {
        return {
          exists: false,
          count: 0,
          processes: []
        };
      } else {
        throw error;
      }
    }
  }

  // テストレポートの存在チェック
  async checkTestReport() {
    try {
      // playwright-reportディレクトリの存在確認
      const reportDir = join(projectRoot, 'playwright-report');
      const fs = await import('fs');
      return fs.existsSync(reportDir);
    } catch (error) {
      return false;
    }
  }

  // テストログの状態チェック（改善版）
  async checkTestLogs() {
    try {
      // 1. メインのテストプロセスチェック
      const mainTestProcess = execSync('ps aux | grep "playwright test" | grep -v grep', { encoding: 'utf8' });
      
      // 2. テストレポートの内容チェック（より確実）
      const reportContent = await this.checkReportContent();
      
      // 3. テスト結果の判定
      if (mainTestProcess.trim()) {
        // メインのテストプロセスが存在する場合
        return {
          isCompleted: false,
          isRunning: true,
          details: 'Main test process is running'
        };
      } else {
        // メインのテストプロセスが存在しない場合
        if (reportContent.hasResults) {
          return {
            isCompleted: true,
            isRunning: false,
            details: `Test completed with ${reportContent.passedCount} passed, ${reportContent.failedCount} failed`
          };
        } else {
          return {
            isCompleted: false,
            isRunning: false,
            details: 'No test results found'
          };
        }
      }
    } catch (error) {
      if (error.status === 1) {
        // プロセスが見つからない場合
        const reportContent = await this.checkReportContent();
        if (reportContent.hasResults) {
          return {
            isCompleted: true,
            isRunning: false,
            details: `Test completed with ${reportContent.passedCount} passed, ${reportContent.failedCount} failed`
          };
        } else {
          return {
            isCompleted: false,
            isRunning: false,
            details: 'No test process and no results found'
          };
        }
      } else {
        return {
          isCompleted: false,
          isRunning: false,
          details: 'Error checking logs'
        };
      }
    }
  }

  // テストレポートの内容をチェック
  async checkReportContent() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // playwright-reportディレクトリ内のindex.htmlをチェック
      const reportFile = path.join(projectRoot, 'playwright-report', 'index.html');
      
      if (fs.existsSync(reportFile)) {
        const content = fs.readFileSync(reportFile, 'utf8');
        
        // テスト結果の情報を抽出
        const passedMatch = content.match(/(\d+)\s+passed/);
        const failedMatch = content.match(/(\d+)\s+failed/);
        
        const passedCount = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failedCount = failedMatch ? parseInt(failedMatch[1]) : 0;
        
        return {
          hasResults: true,
          passedCount,
          failedCount,
          totalCount: passedCount + failedCount
        };
      } else {
        return {
          hasResults: false,
          passedCount: 0,
          failedCount: 0,
          totalCount: 0
        };
      }
    } catch (error) {
      return {
        hasResults: false,
        passedCount: 0,
        failedCount: 0,
        totalCount: 0
      };
    }
  }

  // テストを直接実行して監視（最適解）
  async runAndMonitorTests() {
    console.log('🧪 Starting Playwright tests with direct monitoring...');
    console.log('Press Ctrl+C to stop tests and monitoring');
    
    this.startTime = new Date();
    this.isRunning = true;
    this.status = 'running';
    
    return new Promise((resolve, reject) => {
      // テストを実行
      this.testProcess = spawn('npx', ['playwright', 'test', 'tests/visual/', '--project=chromium', '--timeout=10000'], {
        cwd: projectRoot,
        stdio: 'pipe'
      });

      let output = '';
      let testStarted = false;
      let testCompleted = false;
      
      this.testProcess.stdout.on('data', (data) => {
        const message = data.toString();
        output += message;
        
        // 進捗状況を表示
        if (message.includes('Running')) {
          if (!testStarted) {
            testStarted = true;
            console.log('🔄 Tests are running...');
          }
        } else if (message.includes('passed') || message.includes('failed')) {
          if (!testCompleted) {
            testCompleted = true;
            console.log('📊 Test results received...');
          }
        } else if (message.includes('Serving HTML report')) {
          console.log('📊 Test report generated');
        }
      });

      this.testProcess.stderr.on('data', (data) => {
        console.error(`Test Error: ${data}`);
      });

      this.testProcess.on('close', (code) => {
        this.isRunning = false;
        this.endTime = new Date();
        
        if (code === 0) {
          this.status = 'completed';
          console.log('✅ Tests completed successfully');
          resolve({ success: true, output, exitCode: code });
        } else {
          this.status = 'failed';
          console.log(`❌ Tests failed with exit code ${code}`);
          resolve({ success: false, output, exitCode: code });
        }
      });

      this.testProcess.on('error', (error) => {
        this.isRunning = false;
        this.status = 'failed';
        console.error(`Test execution error: ${error.message}`);
        reject(error);
      });

      // Ctrl+Cの処理
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping tests and monitoring...');
        if (this.testProcess) {
          this.testProcess.kill('SIGTERM');
        }
        this.isRunning = false;
        this.status = 'interrupted';
        resolve({ success: false, output, exitCode: -1, interrupted: true });
      });
    });
  }

  // 外部プロセスの監視（従来の方法 - 精度低）
  async startMonitoring(intervalMs = 2000) {
    console.log('⚠️  External monitoring mode - may not detect test completion accurately');
    console.log('🔍 Starting continuous test monitoring...');
    console.log('Press Ctrl+C to stop monitoring');
    
    let consecutiveCompleted = 0;
    const requiredConsecutive = 5;
    
    const monitor = setInterval(async () => {
      try {
        const processInfo = await this.checkPlaywrightProcesses();
        const now = new Date();
        
        if (processInfo.exists) {
          // プロセスが存在する場合
          if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = now;
            this.status = 'running';
            console.log('🔄 Playwright tests detected (external monitoring)');
            console.log(`Started at: ${this.startTime.toLocaleTimeString()}`);
            console.log(`Active processes: ${processInfo.count}`);
          }
          
          consecutiveCompleted = 0;
          this.lastProcessCheck = now;
          process.stdout.write(`🔄 Running... (${processInfo.count} processes) - Last check: ${now.toLocaleTimeString()}\r`);
        } else {
          // プロセスが存在しない場合
          if (this.isRunning) {
            consecutiveCompleted++;
            process.stdout.write(`⏳ Completed check ${consecutiveCompleted}/${requiredConsecutive}...\r`);
            
            if (consecutiveCompleted >= requiredConsecutive) {
              this.isRunning = false;
              this.endTime = now;
              this.status = 'completed';
              console.log('\n✅ Test monitoring completed (external detection confirmed)');
              console.log(`Last process check: ${this.lastProcessCheck?.toLocaleTimeString() || 'Unknown'}`);
              console.log(`Completion time: ${this.endTime.toLocaleTimeString()}`);
              clearInterval(monitor);
              await this.cleanup();
            }
          } else {
            process.stdout.write('⏸️  No tests detected...\r');
          }
        }
      } catch (error) {
        console.error('❌ Error in monitoring:', error.message);
        clearInterval(monitor);
      }
    }, intervalMs);
    
    return new Promise((resolve) => {
      process.on('SIGINT', () => {
        console.log('\n🛑 Monitoring stopped by user');
        clearInterval(monitor);
        resolve();
      });
    });
  }

  // クリーンアップ
  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    try {
      execSync('pkill -f playwright', { stdio: 'ignore' });
      console.log('✅ Playwright processes cleaned up');
    } catch (e) {
      console.log('ℹ️  No Playwright processes to clean up');
    }
    
    console.log('🎯 Monitoring completed');
  }

  // 現在の状態を表示
  getStatus() {
    return {
      isRunning: this.isRunning,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      lastProcessCheck: this.lastProcessCheck,
      duration: this.startTime && this.endTime ? this.endTime - this.startTime : null
    };
  }
}

// メイン実行
async function main() {
  const monitor = new TestMonitor();
  
  // コマンドライン引数の処理
  const args = process.argv.slice(2);
  
  if (args.includes('--run-and-monitor') || args.includes('-r')) {
    // テスト実行と監視を同時に行うモード
    try {
      const result = await monitor.runAndMonitorTests();
      console.log(`\n📋 Test Summary:`);
      console.log(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (result.exitCode !== undefined) {
        console.log(`Exit Code: ${result.exitCode}`);
      }
      if (result.interrupted) {
        console.log('Interrupted by user');
      }
    } catch (error) {
      console.log('❌ Tests failed or timed out');
    } finally {
      await monitor.cleanup();
    }
  } else if (args.includes('--monitor') || args.includes('-m')) {
    // テスト状態ベース監視モード（改善版）
    await monitor.startMonitoring();
  } else if (args.includes('--status') || args.includes('-s')) {
    // 状態確認モード
    const status = await monitor.checkTestStatus();
    console.log(`\n📊 Current Test Status:`);
    console.log(`Process exists: ${status.processExists}`);
    console.log(`Process count: ${status.processCount}`);
    console.log(`Report exists: ${status.reportExists}`);
    console.log(`Log status: ${status.logInfo.details}`);
    console.log(`Is completed: ${status.isCompleted}`);
  } else {
    // ヘルプ表示
    console.log('🔍 Smart Test Monitor (Status-Based)');
    console.log('\nUsage:');
    console.log('  npm run test:monitor -- --run-and-monitor # 🚀 テスト実行と監視を同時実行');
    console.log('  npm run test:monitor -- --monitor        # 🔍 テスト状態ベース監視（改善版）');
    console.log('  npm run test:monitor -- --status         # 📊 詳細状態確認モード');
    console.log('  npm run test:monitor                     # ❓ ヘルプ表示');
  }
}

main().catch(console.error);
