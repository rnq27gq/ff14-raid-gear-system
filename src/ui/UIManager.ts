import type { StateManager } from '../core/state/StateManager';
import { MessageDisplay } from './MessageDisplay';
import { LoadingScreen } from './LoadingScreen';

/**
 * UI全体を管理するクラス
 */
export class UIManager {
  private stateManager: StateManager;
  private messageDisplay: MessageDisplay;
  private loadingScreen: LoadingScreen;
  private contentElement: HTMLElement | null;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
    this.messageDisplay = new MessageDisplay();
    this.loadingScreen = new LoadingScreen();
    this.contentElement = document.getElementById('content');

    this.initialize();
  }

  /**
   * 初期化
   */
  private initialize(): void {
    // 状態変更を監視
    this.stateManager.subscribe((state) => {
      this.onStateChange(state);
    });
  }

  /**
   * 状態変更時のハンドラ
   */
  private onStateChange(state: any): void {
    // 認証状態に応じて画面を切り替え
    if (state.isAuthenticated && state.currentRaidTier) {
      this.showAuthenticatedState();
    } else if (state.isAuthenticated && !state.currentRaidTier) {
      this.showTierSelection();
    } else {
      this.showAuthScreen();
    }
  }

  /**
   * 認証画面を表示
   */
  private showAuthScreen(): void {
    if (!this.contentElement) return;

    this.contentElement.innerHTML = `
      <div class="auth-screen">
        <div class="auth-card">
          <h2>FF14 零式装備分配システム</h2>
          <div id="authContent">
            <!-- 認証フォームがここに表示されます -->
          </div>
        </div>
      </div>
    `;
  }

  /**
   * レイドティア選択画面を表示
   */
  private showTierSelection(): void {
    if (!this.contentElement) return;

    this.contentElement.innerHTML = `
      <div class="tier-selection">
        <h2>レイドティアを選択してください</h2>
        <div id="tierList">
          <!-- レイドティア一覧がここに表示されます -->
        </div>
      </div>
    `;
  }

  /**
   * 認証後のメイン画面を表示
   */
  private showAuthenticatedState(): void {
    if (!this.contentElement) return;

    this.contentElement.innerHTML = `
      <div class="dashboard">
        <div id="dashboardContent">
          <!-- ダッシュボードがここに表示されます -->
        </div>
      </div>
    `;
  }

  /**
   * メッセージ表示
   */
  showError(message: string): void {
    this.messageDisplay.showError(message);
  }

  showSuccess(message: string): void {
    this.messageDisplay.showSuccess(message);
  }

  showInfo(message: string): void {
    this.messageDisplay.showInfo(message);
  }

  /**
   * ローディング画面
   */
  showLoading(message?: string): void {
    this.loadingScreen.show(message);
  }

  hideLoading(): void {
    this.loadingScreen.hide();
  }

  updateLoadingMessage(message: string): void {
    this.loadingScreen.updateMessage(message);
  }

  /**
   * コンテンツをクリア
   */
  clearContent(): void {
    if (this.contentElement) {
      this.contentElement.innerHTML = '';
    }
  }

  /**
   * コンテンツエリアを取得
   */
  getContentElement(): HTMLElement | null {
    return this.contentElement;
  }
}
