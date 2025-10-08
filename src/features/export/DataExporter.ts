import type { StateManager } from '../../core/state/StateManager';
import type { PlayerMap, Allocation, RaidTier } from '../../types';

/**
 * エクスポートデータの型
 */
export interface ExportData {
  teamId: string | null;
  tier: RaidTier;
  players: PlayerMap;
  allocations: Allocation[];
  prioritySettings?: Record<string, unknown>;
  exportDate: string;
}

/**
 * データエクスポート機能
 */
export class DataExporter {
  private stateManager: StateManager;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  /**
   * 現在のレイドティアのデータをJSON形式でエクスポート
   */
  exportToJSON(): ExportData {
    const state = this.stateManager.getState();
    const currentRaidTier = state.currentRaidTier;

    if (!currentRaidTier) {
      throw new Error('レイドティアが選択されていません');
    }

    const exportData: ExportData = {
      teamId: state.currentTeamId || null,
      tier: currentRaidTier,
      players: state.appData.players[currentRaidTier.id] || {},
      allocations: state.appData.allocations[currentRaidTier.id] || [],
      prioritySettings: state.appData.prioritySettings || {},
      exportDate: new Date().toISOString()
    };

    return exportData;
  }

  /**
   * JSON文字列を生成
   */
  generateJSONFile(): string {
    const data = this.exportToJSON();
    return JSON.stringify(data, null, 2);
  }

  /**
   * JSONファイルをダウンロード
   */
  downloadJSON(): void {
    const jsonString = this.generateJSONFile();
    const state = this.stateManager.getState();
    const currentRaidTier = state.currentRaidTier;

    if (!currentRaidTier) {
      throw new Error('レイドティアが選択されていません');
    }

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `ff14_gear_allocation_${currentRaidTier.id}_${dateStr}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * プレイヤーデータをCSV形式でエクスポート
   */
  exportToCSV(): string {
    const state = this.stateManager.getState();
    const currentRaidTier = state.currentRaidTier;

    if (!currentRaidTier) {
      throw new Error('レイドティアが選択されていません');
    }

    const players = state.appData.players[currentRaidTier.id] || {};
    const lines: string[] = ['Position,Name,Job'];

    for (const [position, player] of Object.entries(players)) {
      lines.push(`${position},${player.name},${player.job}`);
    }

    return lines.join('\n');
  }

  /**
   * CSVファイルをダウンロード
   */
  downloadCSV(): void {
    const csvString = this.exportToCSV();
    const state = this.stateManager.getState();
    const currentRaidTier = state.currentRaidTier;

    if (!currentRaidTier) {
      throw new Error('レイドティアが選択されていません');
    }

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `ff14_gear_allocation_${currentRaidTier.id}_${dateStr}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }
}
