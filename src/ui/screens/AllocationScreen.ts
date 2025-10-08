import type { StateManager } from '../../core/state/StateManager';
import type { MessageDisplay } from '../MessageDisplay';
import type { AllocationEngine } from '../../features/allocation/AllocationEngine';
import type { AllocationResult, Position } from '../../types';

/**
 * 分配画面
 */
export class AllocationScreen {
  private stateManager: StateManager;
  private messageDisplay: MessageDisplay;
  private allocationEngine: AllocationEngine;
  private container: HTMLElement;
  private currentLayer: number = 0;
  private allocationResults: Record<string, AllocationResult> = {};
  private selectedAllocations: Record<string, string> = {};

  constructor(
    container: HTMLElement,
    stateManager: StateManager,
    messageDisplay: MessageDisplay,
    allocationEngine: AllocationEngine
  ) {
    this.container = container;
    this.stateManager = stateManager;
    this.messageDisplay = messageDisplay;
    this.allocationEngine = allocationEngine;
  }

  /**
   * 分配画面を表示
   */
  async showLayer(layer: number): Promise<void> {
    this.currentLayer = layer;

    // プレイヤーデータの確認
    const state = this.stateManager.getState();
    const currentRaidTier = state.currentRaidTier;
    if (!currentRaidTier) {
      this.messageDisplay.showError('レイドティアが選択されていません');
      return;
    }

    const players = state.appData.players[currentRaidTier.id] || {};
    const playerCount = Object.keys(players).length;

    if (playerCount === 0) {
      this.messageDisplay.showError('メンバー情報が登録されていません。まずメンバー管理から設定してください。');
      return;
    }

    if (playerCount < 8) {
      const proceed = confirm(`メンバーが${playerCount}人しか登録されていません。分配を続行しますか？`);
      if (!proceed) {
        return;
      }
    }

    // 分配処理を実行
    await this.processAllocation(layer);
  }

  /**
   * 分配処理を実行
   */
  private async processAllocation(layer: number): Promise<void> {
    try {
      this.messageDisplay.showInfo('分配処理中...');

      // 分配エンジンで処理
      this.allocationResults = this.allocationEngine.processLayer(layer);

      // 結果を表示
      this.displayResults(layer);

      this.messageDisplay.hideAll();
    } catch (error) {
      console.error('分配処理エラー:', error);
      this.messageDisplay.showError('分配処理に失敗しました');
    }
  }

  /**
   * 分配結果を表示
   */
  private displayResults(layer: number): void {
    this.container.innerHTML = `
      <div class="allocation-screen">
        <div class="allocation-header">
          <h2>${layer}層 装備分配結果</h2>
          <p>推奨分配者が自動計算されました。必要に応じて変更してください。</p>
          <button id="backToDashboard" class="btn btn-secondary">
            ← ダッシュボードに戻る
          </button>
        </div>

        <div class="allocation-results" id="allocationResults">
          ${this.renderAllocationItems()}
        </div>

        <div class="allocation-actions">
          <button id="confirmAllocation" class="btn btn-primary btn-large">
            分配を確定
          </button>
          <button id="cancelAllocation" class="btn btn-secondary">
            キャンセル
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * 分配アイテムをレンダリング
   */
  private renderAllocationItems(): string {
    return Object.entries(this.allocationResults).map(([slot, result]) => {
      const needCandidates = result.candidates.filter(c => c.type === 'need');
      const greedCandidates = result.candidates.filter(c => c.type === 'greed');
      const passCandidates = result.candidates.filter(c => c.type === 'pass');

      return `
        <div class="allocation-item">
          <div class="item-header">
            <h4>${result.drop.name}</h4>
            <span class="item-type-badge">${this.getItemTypeLabel(result.drop.type)}</span>
          </div>

          <div class="predicted-winner">
            <strong>推奨取得者:</strong>
            ${this.renderRecommendedWinner(result)}
          </div>

          <div class="allocation-selector">
            <label for="select-${slot}">実際の取得者:</label>
            <select id="select-${slot}" class="form-control" data-slot="${slot}">
              <option value="">選択してください</option>
              ${result.candidates.filter(c => c.canReceive).map(candidate => `
                <option value="${candidate.position}" ${result.recommended?.position === candidate.position ? 'selected' : ''}>
                  ${candidate.player.name} (${candidate.position}) - ${candidate.reason}
                </option>
              `).join('')}
            </select>
          </div>

          <details class="judgment-details">
            <summary>判定詳細を表示</summary>
            <div class="judgment-content">
              ${needCandidates.length > 0 ? `
                <div class="need-section">
                  <h5>Need (${needCandidates.length}人)</h5>
                  ${needCandidates.map(c => `
                    <div class="candidate-item need">
                      ${c.player.name} (${c.position}): ${c.reason} (${c.priority})
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              ${greedCandidates.length > 0 ? `
                <div class="greed-section">
                  <h5>Greed (${greedCandidates.length}人)</h5>
                  ${greedCandidates.map(c => `
                    <div class="candidate-item greed">
                      ${c.player.name} (${c.position}): ${c.reason} (${c.priority})
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              ${passCandidates.length > 0 ? `
                <div class="pass-section">
                  <h5>Pass (${passCandidates.length}人)</h5>
                  ${passCandidates.map(c => `
                    <div class="candidate-item pass">
                      ${c.player.name} (${c.position}): ${c.reason}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </details>
        </div>
      `;
    }).join('');
  }

  /**
   * 推奨取得者を表示
   */
  private renderRecommendedWinner(result: AllocationResult): string {
    if (result.isMultipleRecommended && result.multipleRecommended) {
      return result.multipleRecommended.map(r =>
        `${r.player.name} (${r.position}) [${r.player.job}]`
      ).join('<br>');
    } else if (result.recommended) {
      return `${result.recommended.player.name} (${result.recommended.position}) [${result.recommended.player.job}]`;
    } else {
      return '<span class="text-muted">該当者なし</span>';
    }
  }

  /**
   * アイテムタイプのラベル
   */
  private getItemTypeLabel(type: string): string {
    switch (type) {
      case 'equipment': return '装備';
      case 'material': return '素材';
      case 'weapon_box': return '武器箱';
      case 'direct_weapon': return '直ドロップ武器';
      default: return type;
    }
  }

  /**
   * イベントリスナーを設定
   */
  private attachEventListeners(): void {
    // 取得者選択の変更
    const selects = document.querySelectorAll('[data-slot]');
    selects.forEach(select => {
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const slot = target.dataset.slot;
        if (slot) {
          this.selectedAllocations[slot] = target.value;
        }
      });
    });

    // 分配確定
    const confirmBtn = document.getElementById('confirmAllocation');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.handleConfirm());
    }

    // キャンセル
    const cancelBtn = document.getElementById('cancelAllocation');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.handleCancel());
    }

    // ダッシュボードに戻る
    const backBtn = document.getElementById('backToDashboard');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.handleCancel());
    }
  }

  /**
   * 分配確定処理
   */
  private handleConfirm(): void {
    // 選択された取得者を収集
    const allocations: Record<string, string> = {};
    Object.entries(this.allocationResults).forEach(([slot, result]) => {
      const selectElement = document.getElementById(`select-${slot}`) as HTMLSelectElement;
      if (selectElement && selectElement.value) {
        allocations[slot] = selectElement.value;
      }
    });

    if (Object.keys(allocations).length === 0) {
      this.messageDisplay.showError('取得者を選択してください');
      return;
    }

    const proceed = confirm(`${Object.keys(allocations).length}件の分配を確定しますか？`);
    if (!proceed) {
      return;
    }

    try {
      // 分配を確定（week 1 固定、本来は週数管理が必要）
      this.allocationEngine.confirmAllocations(
        this.currentLayer,
        1,
        this.allocationResults,
        allocations
      );

      this.messageDisplay.showSuccess('分配を確定しました');

      // ダッシュボードに戻る（イベント発火でUIManagerが処理）
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('showDashboard'));
      }, 1000);
    } catch (error) {
      console.error('分配確定エラー:', error);
      this.messageDisplay.showError('分配の確定に失敗しました');
    }
  }

  /**
   * キャンセル処理
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
