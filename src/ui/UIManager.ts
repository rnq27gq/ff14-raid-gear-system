import type { StateManager } from '../core/state/StateManager';
import type { TeamAuth } from '../core/auth/TeamAuth';
import type { AllocationEngine } from '../features/allocation/AllocationEngine';
import { MessageDisplay } from './MessageDisplay';
import { LoadingScreen } from './LoadingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { AllocationScreen } from './screens/AllocationScreen';
import { PlayerManagementScreen } from './screens/PlayerManagementScreen';

/**
 * UI全体を管理するクラス
 */
export class UIManager {
  private stateManager: StateManager;
  private teamAuth: TeamAuth | null = null;
  private allocationEngine: AllocationEngine | null = null;
  private messageDisplay: MessageDisplay;
  private loadingScreen: LoadingScreen;
  private contentElement: HTMLElement | null;
  private authScreen: AuthScreen | null = null;
  private dashboardScreen: DashboardScreen | null = null;
  private allocationScreen: AllocationScreen | null = null;
  private playerManagementScreen: PlayerManagementScreen | null = null;

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
   * AllocationEngineを設定（main.tsから呼ばれる）
   */
  setAllocationEngine(allocationEngine: AllocationEngine): void {
    this.allocationEngine = allocationEngine;
  }

  /**
   * 初期化
   */
  private initialize(): void {
    // 状態変更を監視
    this.stateManager.subscribe((state) => {
      this.onStateChange(state);
    });

    // カスタムイベントを監視
    window.addEventListener('showDashboard', () => {
      this.showDashboard();
    });

    window.addEventListener('showAllocation', ((e: CustomEvent) => {
      const layer = e.detail?.layer;
      if (layer) {
        this.showAllocation(layer);
      }
    }) as EventListener);

    window.addEventListener('showPlayerManagement', () => {
      this.showPlayerManagement();
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
      this.stateManager,
      this.messageDisplay
    );
    this.dashboardScreen.render();
  }

  /**
   * 分配画面を表示
   */
  private async showAllocation(layer: number): Promise<void> {
    if (!this.contentElement || !this.allocationEngine) return;

    this.allocationScreen = new AllocationScreen(
      this.contentElement,
      this.stateManager,
      this.messageDisplay,
      this.allocationEngine
    );
    await this.allocationScreen.showLayer(layer);
  }

  /**
   * プレイヤー管理画面を表示
   */
  private showPlayerManagement(): void {
    if (!this.contentElement) return;

    this.playerManagementScreen = new PlayerManagementScreen(
      this.contentElement,
      this.stateManager,
      this.messageDisplay
    );
    this.playerManagementScreen.render();
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
