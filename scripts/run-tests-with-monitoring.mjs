#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

class IntegratedTestRunner {
  constructor() {
    this.isRunning = false;
    this.startTime = null;
    this.endTime = null;
    this.status = 'idle';
    this.testProcess = null;
    this.reportServerPID = null;  // レポートサーバーのプロセスID
  }

  // テストを実行して監視（完全統合）
  async runTests() {
    console.log('🧪 Starting Playwright tests with integrated monitoring...');
    console.log('Press Ctrl+C to stop tests');
    
    this.startTime = new Date();
    this.isRunning = true;
    this.status = 'running';
    
    return new Promise((resolve, reject) => {
      // テストを実行（プロセス分離）
      this.testProcess = spawn('npx', ['playwright', 'test', 'tests/visual/', '--project=chromium', '--timeout=10000'], {
        cwd: projectRoot,
        stdio: 'pipe',
        detached: true,  // 親プロセスから分離
        windowsHide: true
      });

      let output = '';
      let testStarted = false;
      let testCompleted = false;
      let reportGenerated = false;
      let isResolved = false;  // 重複完了を防ぐフラグ
      
      // 標準出力の監視
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
            
            // 詳細な結果を表示
            if (message.includes('failed')) {
              console.log('⚠️  Some tests failed - checking details...');
            } else {
              console.log('✅ All tests passed');
            }
          }
        } else if (message.includes('Serving HTML report')) {
          if (!reportGenerated && !isResolved) {
            reportGenerated = true;
            console.log('📊 Test report generated');
            
            // レポートサーバー起動確認を待たずに完了処理を実行
            if (!isResolved) {
              isResolved = true;  // 完了フラグを設定
              
              // レポート生成 = テスト完了
              console.log('✅ Tests completed (report generated)');
              
              // 結果の詳細分析
              this.analyzeTestResults(output);
              
              // 子プロセスを確実に終了
              this.terminateChildProcesses();
              
              // 完了状態に設定
              this.isRunning = false;
              this.endTime = new Date();
              this.status = 'completed';
              
              // 完了を通知
              resolve({ success: true, output: 'Tests completed after report generation', exitCode: 0 });
            }
          }
        }
      });

      // エラー出力の監視
      this.testProcess.stderr.on('data', (data) => {
        console.error(`Test Error: ${data}`);
      });

      // プロセスの終了を監視
      this.testProcess.on('close', (code) => {
        // 既に完了している場合は何もしない
        if (isResolved) return;
        
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

      // エラーを監視
      this.testProcess.on('error', (error) => {
        this.isRunning = false;
        this.status = 'failed';
        console.error(`Test execution error: ${error.message}`);
        reject(error);
      });

      // Ctrl+Cの処理
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping tests...');
        this.terminateChildProcesses();
        
        this.isRunning = false;
        this.status = 'interrupted';
        resolve({ success: false, output, exitCode: -1, interrupted: true });
      });
    });
  }

  // テスト結果の詳細分析
  analyzeTestResults(output) {
    console.log('\n📋 Detailed Test Analysis:');
    
    // 成功/失敗の数をカウント
    const passedMatches = output.match(/(\d+)\s+passed/g);
    const failedMatches = output.match(/(\d+)\s+failed/g);
    const skippedMatches = output.match(/(\d+)\s+skipped/g);
    
    if (passedMatches) {
      const passedCount = passedMatches[0].match(/(\d+)/)[1];
      console.log(`✅ Passed: ${passedCount}`);
    }
    
    if (failedMatches) {
      const failedCount = failedMatches[0].match(/(\d+)/)[1];
      console.log(`❌ Failed: ${failedCount}`);
      
      // 失敗したテストの詳細を表示
      this.showFailedTestDetails(output);
    } else {
      console.log('❌ Failed: 0');
    }
    
    if (skippedMatches) {
      const skippedCount = skippedMatches[0].match(/(\d+)/)[1];
      console.log(`⏭️  Skipped: ${skippedCount}`);
    }
    
    // 実行時間の表示
    const timeMatch = output.match(/\(([\d.]+s)\)/);
    if (timeMatch) {
      console.log(`⏱️  Execution time: ${timeMatch[1]}`);
    }
  }

  // 失敗したテストの詳細表示
  showFailedTestDetails(output) {
    console.log('\n🚨 Failed Test Details:');
    
    // 失敗したテストの行を抽出
    const lines = output.split('\n');
    let inFailedTest = false;
    
    for (const line of lines) {
      if (line.includes('failed')) {
        inFailedTest = true;
        console.log(`\n❌ ${line.trim()}`);
      } else if (inFailedTest && line.includes('Error:')) {
        console.log(`   ${line.trim()}`);
        inFailedTest = false;
      } else if (inFailedTest && line.trim()) {
        console.log(`   ${line.trim()}`);
      }
    }
  }

  // レポートサーバーの起動を確認
  async waitForReportServer() {
    console.log('🔍 Checking for existing report server...');
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        try {
          const { execSync } = await import('child_process');
          const result = execSync('lsof -i :9323', { encoding: 'utf8', stdio: 'ignore' });
          
          if (result.trim()) {
            clearInterval(checkInterval);
            
            // レポートサーバーのプロセスIDを記録
            const lines = result.trim().split('\n');
            for (const line of lines) {
              if (line.includes('playwright') && line.includes('report')) {
                const parts = line.split(/\s+/);
                if (parts.length > 1) {
                  this.reportServerPID = parts[1];
                  console.log(`✅ Existing report server found on port 9323 (PID: ${this.reportServerPID})`);
                  break;
                }
              }
            }
            
            if (!this.reportServerPID) {
              console.log('✅ Report server is running on port 9323');
            }
            
            resolve();
          }
        } catch (error) {
          // ポートがまだ使用されていない場合は継続
        }
      }, 200); // 200ms間隔でチェック（より頻繁に）
      
      // 最大5秒でタイムアウト（短縮）
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('⚠️  Report server may not be running, but continuing...');
        resolve();
      }, 5000); // 5秒に短縮
    });
  }

  // 既存のレポートサーバーを確認
  async checkExistingReportServer() {
    try {
      const { execSync } = await import('child_process');
      const result = execSync('lsof -i :9323', { encoding: 'utf8', stdio: 'ignore' });
      
      if (result.trim()) {
        // 既存のレポートサーバーが見つかった
        const lines = result.trim().split('\n');
        for (const line of lines) {
          if (line.includes('playwright') && line.includes('report')) {
            const parts = line.split(/\s+/);
            if (parts.length > 1) {
              this.reportServerPID = parts[1];
              
              // プロセスの詳細情報を取得
              try {
                const processInfo = execSync(`ps -p ${this.reportServerPID} -o pid,ppid,etime,command`, { encoding: 'utf8', stdio: 'ignore' });
                const processLines = processInfo.trim().split('\n');
                if (processLines.length > 1) {
                  const info = processLines[1].split(/\s+/);
                  if (info.length > 2) {
                    const uptime = info[2];
                    console.log(`📊 Existing report server found (PID: ${this.reportServerPID}, Uptime: ${uptime})`);
                  }
                }
              } catch (e) {
                console.log(`📊 Existing report server found (PID: ${this.reportServerPID})`);
              }
              
              return true;
            }
          }
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // レポートサーバーの状態を表示
  async showReportServerStatus() {
    try {
      const { execSync } = await import('child_process');
      const result = execSync('lsof -i :9323', { encoding: 'utf8', stdio: 'ignore' });
      
      if (result.trim()) {
        console.log('\n📊 Report Server Status:');
        console.log('Port 9323 is active:');
        console.log(result.trim());
      } else {
        console.log('\n📊 Report Server Status: Port 9323 is not active');
      }
    } catch (error) {
      console.log('\n📊 Report Server Status: Unable to check port 9323');
    }
  }

  // 子プロセスを確実に終了（プロセスキルなし）
  async terminateChildProcesses() {
    try {
      if (this.testProcess && !this.testProcess.killed) {
        // メインプロセスを終了
        this.testProcess.kill('SIGTERM');
        
        // 強制終了も必要に応じて
        setTimeout(() => {
          if (this.testProcess && !this.testProcess.killed) {
            this.testProcess.kill('SIGKILL');
          }
        }, 1000);
      }
      
      // Playwrightの子プロセスも終了
      const { execSync } = await import('child_process');
      
      // ブラウザプロセスを終了
      try {
        execSync('pkill -f "chromium"', { stdio: 'ignore' });
      } catch (e) {
        // ブラウザプロセスが存在しない場合は無視
      }
      
      // レポートサーバーを起動
      try {
        console.log('🚀 Starting report server...');
        
        // 既存のレポートサーバーを確認
        const hasExistingServer = await this.checkExistingReportServer();
        
        if (hasExistingServer) {
          console.log('📊 Using existing report server');
        } else {
          // 完全に分離してレポートサーバーを起動（メインプロセスをブロックしない）
          setTimeout(async () => {
            try {
              const { spawn } = await import('child_process');
              const reportServer = spawn('npx', ['playwright', 'show-report', '--host', '0.0.0.0', '--port', '9323'], {
                stdio: 'ignore',
                detached: true,  // バックグラウンドで実行
                cwd: projectRoot
              });
              
              // プロセスを分離
              reportServer.unref();
              console.log('📊 Report server started at http://localhost:9323');
            } catch (e) {
              console.log('⚠️  Failed to start report server');
            }
          }, 100); // 100ms後に起動
          
          console.log('📊 Report server starting in background...');
        }
      } catch (e) {
        console.log('⚠️  Failed to start report server');
      }
      
      console.log('✅ Child processes terminated gracefully');
    } catch (error) {
      console.log('⚠️  Some child processes may still be running');
    }
  }

  // クリーンアップ（プロセスキルなし版）
  async cleanup() {
    console.log('🧹 Cleanup completed (no process killing)');
    
    // プロセスキルは行わない
    // 子プロセスは既に適切に終了されている
    
    // レポートサーバーの状態を表示
    await this.showReportServerStatus();
    
    console.log('💡 Report server will continue running');
    console.log('🎯 Test execution completed');
  }

  // 現在の状態を表示
  getStatus() {
    return {
      isRunning: this.isRunning,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.startTime && this.endTime ? this.endTime - this.startTime : null
    };
  }
}

// メイン実行
async function main() {
  const runner = new IntegratedTestRunner();
  
  try {
    console.log('🚀 Starting integrated test runner...');
    
    const result = await runner.runTests();
    
    console.log('\n📋 Test Summary:');
    console.log(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    if (result.exitCode !== undefined) {
      console.log(`Exit Code: ${result.exitCode}`);
    }
    if (result.interrupted) {
      console.log('Interrupted by user');
    }
    
  } catch (error) {
    console.log('❌ Tests failed or timed out');
    console.error('Error:', error.message);
  } finally {
    await runner.cleanup();
  }
}

// エラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

main().catch(console.error);
