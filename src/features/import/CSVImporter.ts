import type { StateManager } from '../../core/state/StateManager';
import type { PlayerMap, Player, Position } from '../../types';

/**
 * CSVバリデーション結果
 */
export interface CSVValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * インポートサマリー
 */
export interface ImportSummary {
  totalPlayers: number;
  validPlayers: number;
  invalidRows: number;
}

/**
 * CSVインポート機能
 */
export class CSVImporter {
  private stateManager: StateManager;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  /**
   * CSV文字列をパースしてPlayerMapを生成
   */
  parseCSV(csvData: string): PlayerMap {
    const lines = csvData.split('\n').filter(line => line.trim());
    const players: PlayerMap = {};

    if (lines.length < 2) {
      return players;
    }

    // ヘッダー行をスキップ（1行目）
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(col => col.trim());

      // 列数チェック（Position, Name, Job の3列）
      if (columns.length < 3) {
        continue;
      }

      const [position, name, job] = columns;

      const player: Player = {
        name,
        job,
        position: position as Position,
        dynamicPriority: 0,
        weaponWish1: job, // デフォルトでジョブ武器を第一希望
        weaponWish2: '',
        policies: {
          武器: '通常',
          頭: '通常',
          胴: '通常',
          手: '通常',
          脚: '通常',
          足: '通常',
          耳: '通常',
          首: '通常',
          腕: '通常',
          指: '通常'
        }
      };

      players[position as Position] = player;
    }

    return players;
  }

  /**
   * CSVデータをインポートしてStateManagerに保存
   */
  importPlayers(csvData: string): void {
    const state = this.stateManager.getState();
    const currentRaidTier = state.currentRaidTier;

    if (!currentRaidTier) {
      throw new Error('レイドティアが選択されていません');
    }

    const players = this.parseCSV(csvData);

    if (Object.keys(players).length === 0) {
      throw new Error('有効なプレイヤーデータが見つかりません');
    }

    // 各プレイヤーを個別に保存
    for (const [position, player] of Object.entries(players)) {
      this.stateManager.updatePlayer(currentRaidTier.id, position as Position, player);
    }
  }

  /**
   * CSVデータのバリデーション
   */
  validateCSV(csvData: string): CSVValidationResult {
    const errors: string[] = [];

    // 空チェック
    if (!csvData.trim()) {
      errors.push('CSVデータが空です');
      return { valid: false, errors };
    }

    const lines = csvData.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      errors.push('CSVデータが空です');
      return { valid: false, errors };
    }

    // ヘッダーチェック
    const header = lines[0].trim();
    if (header !== 'Position,Name,Job') {
      errors.push('CSVヘッダーが不正です。Position,Name,Jobである必要があります。');
    }

    // データ行チェック
    if (lines.length < 2) {
      errors.push('有効なプレイヤーデータが見つかりません');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * インポート結果のサマリーを取得
   */
  getImportSummary(csvData: string): ImportSummary {
    const lines = csvData.split('\n').filter(line => line.trim());
    let validPlayers = 0;
    let invalidRows = 0;

    // ヘッダー行をスキップ
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(col => col.trim());

      if (columns.length >= 3) {
        validPlayers++;
      } else {
        invalidRows++;
      }
    }

    return {
      totalPlayers: validPlayers,
      validPlayers,
      invalidRows
    };
  }
}
