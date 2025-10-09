import type { StateManager } from '../../core/state/StateManager';
import type { MessageDisplay } from '../MessageDisplay';
import type { Position, Job, Policy } from '../../types';
import { POSITIONS, JOBS, SLOTS } from '../../config/constants';

/**
 * ダッシュボード画面
 */
export class DashboardScreen {
  private stateManager: StateManager;
  private messageDisplay: MessageDisplay;
  private container: HTMLElement;

  constructor(container: HTMLElement, stateManager: StateManager, messageDisplay: MessageDisplay) {
    this.container = container;
    this.stateManager = stateManager;
    this.messageDisplay = messageDisplay;
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

    const players = state.appData.players || {};

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
          <h3>メンバー設定</h3>
          ${this.renderMemberTable(players)}
          <div style="text-align: center; margin-top: 10px;">
            <button id="saveAllBtn" class="btn btn-primary btn-large">一括保存</button>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * メンバーテーブルをレンダリング（編集可能）
   */
  private renderMemberTable(players: Partial<Record<Position, any>>): string {
    return `
      <div class="integrated-table-container">
        <table class="integrated-member-table">
          <thead>
            <tr>
              <th style="width: 60px;">ロール</th>
              <th style="width: 150px;">名前</th>
              <th style="width: 150px;">ジョブ</th>
              <th colspan="10" style="text-align: center;">装備方針（空白=トームストーン）</th>
              <th style="width: 130px;">武器第2希望</th>
              <th style="width: 130px;">武器第3希望</th>
            </tr>
            <tr>
              <th colspan="3"></th>
              ${SLOTS.map(slot => `<th style="width: 50px; font-size: 12px;">${slot}</th>`).join('')}
              <th colspan="2"></th>
            </tr>
          </thead>
          <tbody>
            ${POSITIONS.map((position: Position) => this.renderPlayerRow(position, players[position])).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * プレイヤー行をレンダリング
   */
  private renderPlayerRow(position: Position, player: any): string {
    const name = player?.name || '';
    const job = player?.job || '';
    const weaponWish2 = player?.weaponWish2 || '';
    const weaponWish1 = player?.weaponWish1 || '';
    const policies = player?.policies || {};

    return `
      <tr>
        <td class="position-cell ${this.getPositionRoleClass(position)}">${position}</td>
        <td>
          <input
            type="text"
            class="table-input"
            id="name-${position}"
            value="${name}"
            placeholder="名前"
          />
        </td>
        <td>
          <select class="table-select" id="job-${position}">
            <option value="">選択</option>
            ${JOBS.map((j: Job) => `
              <option value="${j}" ${job === j ? 'selected' : ''}>${j}</option>
            `).join('')}
          </select>
        </td>
        ${SLOTS.map((slot: string) => {
          const policy = policies[slot] || '通常';
          return `
            <td class="policy-cell">
              <input
                type="checkbox"
                id="policy-${position}-${slot}"
                ${policy === '優先' ? 'checked' : ''}
                title="${slot}を零式で取得"
              />
            </td>
          `;
        }).join('')}
        <td>
          <select class="table-select" id="weaponWish2-${position}">
            <option value="">選択</option>
            ${JOBS.map((j: Job) => `
              <option value="${j}" ${weaponWish2 === j ? 'selected' : ''}>${j}</option>
            `).join('')}
          </select>
        </td>
        <td>
          <select class="table-select" id="weaponWish1-${position}">
            <option value="">選択</option>
            ${JOBS.map((j: Job) => `
              <option value="${j}" ${weaponWish1 === j ? 'selected' : ''}>${j}</option>
            `).join('')}
          </select>
        </td>
      </tr>
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

    // 一括保存ボタン
    const saveAllBtn = document.getElementById('saveAllBtn');
    if (saveAllBtn) {
      saveAllBtn.addEventListener('click', () => this.handleSaveAll());
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
   * 一括保存ボタンクリック
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
      let hasAtLeastOnePlayer = false;

      // 各ポジションのデータを収集
      for (const position of POSITIONS) {
        const name = (document.getElementById(`name-${position}`) as HTMLInputElement)?.value.trim();
        const job = (document.getElementById(`job-${position}`) as HTMLSelectElement)?.value;
        const weaponWish2 = (document.getElementById(`weaponWish2-${position}`) as HTMLSelectElement)?.value;
        const weaponWish1 = (document.getElementById(`weaponWish1-${position}`) as HTMLSelectElement)?.value;

        // 名前とジョブが入力されている場合のみ保存
        if (name && job) {
          hasAtLeastOnePlayer = true;
          const policies: Record<string, Policy> = {};

          for (const slot of SLOTS) {
            const checkbox = document.getElementById(`policy-${position}-${slot}`) as HTMLInputElement;
            policies[slot] = checkbox?.checked ? '優先' : '通常';
          }

          players[position] = {
            name,
            job: job as Job,
            position,
            weaponWish2: weaponWish2 || undefined,
            weaponWish1: weaponWish1 || undefined,
            policies,
            dynamicPriority: 0
          };
        }
      }

      if (!hasAtLeastOnePlayer) {
        this.messageDisplay.showError('少なくとも1名のメンバー（名前とジョブ）を入力してください');
        return;
      }

      // 状態を更新
      const updatedAppData = {
        ...state.appData,
        players: players
      };

      this.stateManager.setState({
        appData: updatedAppData
      });

      this.messageDisplay.showSuccess('メンバー情報を保存しました');

      // 画面を再レンダリング
      setTimeout(() => {
        this.render();
      }, 1000);
    } catch (error) {
      console.error('メンバー情報保存エラー:', error);
      this.messageDisplay.showError('保存に失敗しました');
    }
  }

  /**
   * 画面をクリア
   */
  clear(): void {
    this.container.innerHTML = '';
  }
}
