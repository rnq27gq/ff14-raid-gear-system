import type { StateManager } from '../core/state/StateManager';
import type { TeamAuth } from '../core/auth/TeamAuth';
import { MessageDisplay } from './MessageDisplay';
import { LoadingScreen } from './LoadingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { DashboardScreen } from './screens/DashboardScreen';

/**
 * UI全体を管理するクラス
 */
export class UIManager {
  private stateManager: StateManager;
  private teamAuth: TeamAuth | null = null;
  private messageDisplay: MessageDisplay;
  private loadingScreen: LoadingScreen;
  private contentElement: HTMLElement | null;
  private authScreen: AuthScreen | null = null;
  private dashboardScreen: DashboardScreen | null = null;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
    this.messageDisplay = new MessageDisplay();
    this.loadingScreen = new LoadingScreen();
    this.contentElement = document.getElementById('content');

    this.initialize();
  }

  /**
   * TeamAuthを設定（main.tsから呼ばれる）
   */
  setTeamAuth(teamAuth: TeamAuth): void {
    this.teamAuth = teamAuth;
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
      this.showDashboard();
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
    if (!this.contentElement || !this.teamAuth) return;

    this.authScreen = new AuthScreen(
      this.contentElement,
      this.teamAuth,
      this.messageDisplay
    );
    this.authScreen.render();
  }

  /**
   * レイドティア選択画面を表示
   */
  private showTierSelection(): void {
    if (!this.contentElement) return;

    this.contentElement.innerHTML = `
      <div class="tier-selection">
        <h2>レイドティアを選択してください</h2>
        <p class="text-muted">現在、レイドティアが設定されていません。</p>
      </div>
    `;
  }

  /**
   * ダッシュボード画面を表示
   */
  private showDashboard(): void {
    if (!this.contentElement) return;

    this.dashboardScreen = new DashboardScreen(
      this.contentElement,
      this.stateManager
    );
    this.dashboardScreen.render();
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
