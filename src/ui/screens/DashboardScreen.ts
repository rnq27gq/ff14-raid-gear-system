import type { StateManager } from '../../core/state/StateManager';
import type { Position } from '../../types';
import { POSITIONS } from '../../config/constants';

/**
 * ダッシュボード画面
 */
export class DashboardScreen {
  private stateManager: StateManager;
  private container: HTMLElement;

  constructor(container: HTMLElement, stateManager: StateManager) {
    this.container = container;
    this.stateManager = stateManager;
  }

  /**
   * ダッシュボード画面を表示
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
      <div class="dashboard">
        <h1>${currentRaidTier.name}</h1>

        <div class="section dashboard-controls">
          <div class="dashboard-layer-grid">
            <button class="dashboard-layer-button" data-layer="1">1層</button>
            <button class="dashboard-layer-button" data-layer="2">2層</button>
            <button class="dashboard-layer-button" data-layer="3">3層</button>
            <button class="dashboard-layer-button" data-layer="4">4層</button>
            <button class="dashboard-layer-button" id="priorityBtn">優先順位設定</button>
            <button class="dashboard-layer-button" id="statsBtn">統計情報</button>
            <button class="dashboard-layer-button" id="historyBtn">配布履歴</button>
          </div>
        </div>

        <div class="section member-section">
          <div class="section-header">
            <h3>メンバー設定</h3>
            <button id="editPlayersBtn" class="btn btn-primary">
              メンバー編集
            </button>
          </div>
          ${this.renderMemberTable(players)}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * メンバーテーブルをレンダリング
   */
  private renderMemberTable(players: Partial<Record<Position, any>>): string {
    const slots = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];

    return `
      <div class="integrated-table-container">
        <table class="integrated-member-table">
          <thead>
            <tr>
              <th style="width: 45px;">ロール</th>
              <th style="width: 120px;">名前</th>
              <th style="width: 130px;">ジョブ</th>
              <th colspan="10" style="text-align: center;">装備方針</th>
              <th style="width: 130px;">武器第2希望</th>
            </tr>
            <tr>
              <th colspan="3"></th>
              ${slots.map(slot => `<th style="width: 45px; font-size: 12px;">${slot}</th>`).join('')}
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${POSITIONS.map((position: Position) => {
              const player = players[position];
              if (!player) {
                return `
                  <tr>
                    <td>${position}</td>
                    <td colspan="12" class="text-muted">未設定</td>
                  </tr>
                `;
              }

              return `
                <tr>
                  <td class="position-cell ${this.getPositionRoleClass(position)}">${position}</td>
                  <td>${player.name || '-'}</td>
                  <td>${player.job || '-'}</td>
                  ${slots.map(slot => {
                    const policy = player.policies?.[slot] || '通常';
                    const policyClass = policy === '優先' ? 'priority' : policy === '最後' ? 'last' : '';
                    return `<td class="policy-cell ${policyClass}">${policy === '通常' ? '' : policy}</td>`;
                  }).join('')}
                  <td>${player.weaponWish2 || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
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
    // 層ボタン
    const layerButtons = document.querySelectorAll('[data-layer]');
    layerButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const layer = (e.target as HTMLElement).dataset.layer;
        if (layer) {
          this.handleLayerClick(parseInt(layer));
        }
      });
    });

    // その他のボタン
    const priorityBtn = document.getElementById('priorityBtn');
    if (priorityBtn) {
      priorityBtn.addEventListener('click', () => this.handlePriorityClick());
    }

    const statsBtn = document.getElementById('statsBtn');
    if (statsBtn) {
      statsBtn.addEventListener('click', () => this.handleStatsClick());
    }

    const historyBtn = document.getElementById('historyBtn');
    if (historyBtn) {
      historyBtn.addEventListener('click', () => this.handleHistoryClick());
    }

    // メンバー編集ボタン
    const editPlayersBtn = document.getElementById('editPlayersBtn');
    if (editPlayersBtn) {
      editPlayersBtn.addEventListener('click', () => this.handleEditPlayersClick());
    }
  }

  /**
   * 層ボタンクリック
   */
  private handleLayerClick(layer: number): void {
    window.dispatchEvent(new CustomEvent('showAllocation', { detail: { layer } }));
  }

  /**
   * 優先順位設定ボタンクリック
   */
  private handlePriorityClick(): void {
    console.log('優先順位設定が選択されました');
    // 今後実装
  }

  /**
   * 統計情報ボタンクリック
   */
  private handleStatsClick(): void {
    console.log('統計情報が選択されました');
    // 今後実装
  }

  /**
   * 配布履歴ボタンクリック
   */
  private handleHistoryClick(): void {
    console.log('配布履歴が選択されました');
    // 今後実装
  }

  /**
   * メンバー編集ボタンクリック
   */
  private handleEditPlayersClick(): void {
    window.dispatchEvent(new CustomEvent('showPlayerManagement'));
  }

  /**
   * 画面をクリア
   */
  clear(): void {
    this.container.innerHTML = '';
  }
}
