import { StateManager } from './core/state/StateManager';
import { SupabaseStorageClient } from './core/storage/SupabaseClient';
import { TeamAuth } from './core/auth/TeamAuth';
import { UIManager } from './ui/UIManager';
import { AllocationEngine } from './features/allocation/AllocationEngine';
import { PriorityCalculator } from './features/allocation/PriorityCalculator';

/**
 * アプリケーションのメインクラス
 */
class Application {
  private stateManager: StateManager;
  private storageClient: SupabaseStorageClient;
  private teamAuth: TeamAuth;
  private uiManager: UIManager;
  private allocationEngine: AllocationEngine;

  constructor() {
    // 環境変数からSupabase設定を取得
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase設定が見つかりません。環境変数を確認してください。');
    }

    // コアモジュールの初期化
    this.stateManager = new StateManager();
    this.storageClient = new SupabaseStorageClient({
      url: supabaseUrl,
      anonKey: supabaseAnonKey
    });
    this.teamAuth = new TeamAuth(this.stateManager, this.storageClient);

    // 分配エンジンの初期化
    const priorityCalculator = new PriorityCalculator(this.stateManager);
    this.allocationEngine = new AllocationEngine(this.stateManager, priorityCalculator);

    // UIManagerの初期化と依存性注入
    this.uiManager = new UIManager(this.stateManager);
    this.uiManager.setTeamAuth(this.teamAuth);
    this.uiManager.setAllocationEngine(this.allocationEngine);
  }

  /**
   * アプリケーションを起動
   */
  async start(): Promise<void> {
    try {
      console.log('🚀 FF14装備分配システムを起動中...');

      // ローディング画面を表示
      this.uiManager.showLoading('システムを初期化中...');

      // 自動ログインを試行
      this.uiManager.updateLoadingMessage('認証情報を確認中...');
      const autoLoginSuccess = await this.teamAuth.tryAutoLogin();

      if (autoLoginSuccess) {
        console.log('✅ 自動ログイン成功');
        this.uiManager.hideLoading();
      } else {
        console.log('ℹ️ 自動ログイン失敗 - ログイン画面を表示');
        this.uiManager.hideLoading();
      }

      // グローバルオブジェクトに登録（デバッグ用）
      if (typeof window !== 'undefined') {
        (window as any).app = {
          stateManager: this.stateManager,
          storageClient: this.storageClient,
          teamAuth: this.teamAuth,
          uiManager: this.uiManager,
          allocationEngine: this.allocationEngine
        };
      }

      console.log('✅ アプリケーション起動完了');
    } catch (error) {
      console.error('❌ アプリケーション起動エラー:', error);
      this.uiManager.hideLoading();
      this.uiManager.showError(
        'システムの初期化に失敗しました。ページを再読み込みしてください。'
      );
    }
  }
}

/**
 * DOMContentLoaded後にアプリケーションを起動
 */
document.addEventListener('DOMContentLoaded', async () => {
  const app = new Application();
  await app.start();
});
