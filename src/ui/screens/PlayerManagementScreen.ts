import type { StateManager } from '../../core/state/StateManager';
import type { MessageDisplay } from '../MessageDisplay';
import type { Position, Job, Policy } from '../../types';
import { POSITIONS, JOBS, SLOTS } from '../../config/constants';

/**
 * プレイヤー管理画面
 */
export class PlayerManagementScreen {
  private stateManager: StateManager;
  private messageDisplay: MessageDisplay;
  private container: HTMLElement;

  constructor(
    container: HTMLElement,
    stateManager: StateManager,
    messageDisplay: MessageDisplay
  ) {
    this.container = container;
    this.stateManager = stateManager;
    this.messageDisplay = messageDisplay;
  }

  /**
   * プレイヤー管理画面を表示
   */
  render(): void {
    const state = this.stateManager.getState();
    const currentRaidTier = state.currentRaidTier;

    if (!currentRaidTier) {
      this.container.innerHTML = '<p>レイドティアが選択されていません</p>';
      return;
    }

    const players = state.appData.players[currentRaidTier.id] || {};

    this.container.innerHTML = `
      <div class="player-management-screen">
        <div class="screen-header">
          <h2>プレイヤー設定</h2>
          <button id="backToDashboard" class="btn btn-secondary">
            ← ダッシュボードに戻る
          </button>
        </div>

        <div class="player-forms">
          ${POSITIONS.map((position: Position) => this.renderPlayerForm(position, players[position])).join('')}
        </div>

        <div class="form-actions">
          <button id="saveAllPlayers" class="btn btn-primary btn-large">
            すべて保存
          </button>
          <button id="cancelEdit" class="btn btn-secondary">
            キャンセル
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * プレイヤーフォームをレンダリング
   */
  private renderPlayerForm(position: Position, player: any): string {
    const name = player?.name || '';
    const job = player?.job || '';
    const weaponWish2 = player?.weaponWish2 || '';
    const policies = player?.policies || {};

    return `
      <div class="player-form-card">
        <h3 class="position-header ${this.getPositionRoleClass(position)}">${position}</h3>

        <div class="form-group">
          <label>名前</label>
          <input
            type="text"
            class="form-control"
            id="name-${position}"
            value="${name}"
            placeholder="プレイヤー名を入力"
          />
        </div>

        <div class="form-group">
          <label>ジョブ</label>
          <select class="form-control" id="job-${position}">
            <option value="">選択してください</option>
            ${JOBS.map((j: Job) => `
              <option value="${j}" ${job === j ? 'selected' : ''}>${j}</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label>武器第2希望</label>
          <input
            type="text"
            class="form-control"
            id="weaponWish2-${position}"
            value="${weaponWish2}"
            placeholder="例: 竜騎士"
          />
        </div>

        <div class="form-group">
          <label>装備方針</label>
          <div class="policy-grid">
            ${SLOTS.map((slot: string) => {
              const policy = policies[slot] || '通常';
              return `
                <div class="policy-item">
                  <span class="policy-label">${slot}</span>
                  <select class="form-control policy-select" id="policy-${position}-${slot}">
                    <option value="優先" ${policy === '優先' ? 'selected' : ''}>優先</option>
                    <option value="通常" ${policy === '通常' ? 'selected' : ''}>通常</option>
                    <option value="最後" ${policy === '最後' ? 'selected' : ''}>最後</option>
                  </select>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * ポジションからロールクラスを取得
   */
  private getPositionRoleClass(position: Position): string {
    if (position === 'MT' || position === 'ST') return 'tank';
    if (position === 'H1' || position === 'H2') return 'healer';
    return 'dps';
  }

  /**
   * イベントリスナーを設定
   */
  private attachEventListeners(): void {
    // すべて保存ボタン
    const saveBtn = document.getElementById('saveAllPlayers');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.handleSaveAll());
    }

    // キャンセルボタン
    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.handleCancel());
    }

    // ダッシュボードに戻るボタン
    const backBtn = document.getElementById('backToDashboard');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.handleCancel());
    }
  }

  /**
   * すべて保存
   */
  private async handleSaveAll(): Promise<void> {
    try {
      const state = this.stateManager.getState();
      const currentRaidTier = state.currentRaidTier;
      if (!currentRaidTier) {
        this.messageDisplay.showError('レイドティアが選択されていません');
        return;
      }

      const players: Record<string, any> = {};

      // 各ポジションのデータを収集
      for (const position of POSITIONS) {
        const name = (document.getElementById(`name-${position}`) as HTMLInputElement)?.value.trim();
        const job = (document.getElementById(`job-${position}`) as HTMLSelectElement)?.value;
        const weaponWish2 = (document.getElementById(`weaponWish2-${position}`) as HTMLInputElement)?.value.trim();

        // 名前が入力されている場合のみ保存
        if (name) {
          const policies: Record<string, Policy> = {};
          for (const slot of SLOTS) {
            const policySelect = document.getElementById(`policy-${position}-${slot}`) as HTMLSelectElement;
            if (policySelect) {
              policies[slot] = policySelect.value as Policy;
            }
          }

          players[position] = {
            name,
            job: job as Job,
            weaponWish2,
            policies,
            dynamicPriority: 0
          };
        }
      }

      // 状態を更新
      const updatedAppData = {
        ...state.appData,
        players: {
          ...state.appData.players,
          [currentRaidTier.id]: players
        }
      };

      this.stateManager.setState({
        appData: updatedAppData
      });

      this.messageDisplay.showSuccess('プレイヤー情報を保存しました');

      // ダッシュボードに戻る
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('showDashboard'));
      }, 1000);
    } catch (error) {
      console.error('プレイヤー情報保存エラー:', error);
      this.messageDisplay.showError('保存に失敗しました');
    }
  }

  /**
   * キャンセル
   */
  private handleCancel(): void {
    window.dispatchEvent(new CustomEvent('showDashboard'));
  }

  /**
   * 画面をクリア
   */
  clear(): void {
    this.container.innerHTML = '';
  }
}
