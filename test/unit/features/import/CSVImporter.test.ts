import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CSVImporter } from '../../../../src/features/import/CSVImporter';
import { StateManager } from '../../../../src/core/state/StateManager';

describe('CSVImporter', () => {
  let importer: CSVImporter;
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
    stateManager.setState({
      currentRaidTier: { id: 'tier-1', name: 'Test Tier', createdAt: '2025-01-01' },
      currentTeamId: 'team-123',
      appData: {
        raidTiers: {
          'tier-1': { id: 'tier-1', name: 'Test Tier', createdAt: '2025-01-01' }
        },
        players: {
          'tier-1': {}
        },
        allocations: {
          'tier-1': []
        },
        settings: {},
        prioritySettings: {}
      }
    });
    importer = new CSVImporter(stateManager);
  });

  describe('parseCSV', () => {
    it('CSV文字列をパースして PlayerMap を生成する', () => {
      const csvData = `Position,Name,Job
MT,Player1,ナイト
ST,Player2,戦士
H1,Player3,白魔道士`;

      const result = importer.parseCSV(csvData);

      expect(result).toHaveProperty('MT');
      expect(result).toHaveProperty('ST');
      expect(result).toHaveProperty('H1');
      expect(result.MT.name).toBe('Player1');
      expect(result.MT.job).toBe('ナイト');
      expect(result.ST.name).toBe('Player2');
      expect(result.ST.job).toBe('戦士');
    });

    it('空白行を無視する', () => {
      const csvData = `Position,Name,Job
MT,Player1,ナイト

ST,Player2,戦士
`;

      const result = importer.parseCSV(csvData);

      expect(Object.keys(result)).toHaveLength(2);
    });

    it('不正な行（列数不足）をスキップする', () => {
      const csvData = `Position,Name,Job
MT,Player1,ナイト
ST,Player2
H1,Player3,白魔道士`;

      const result = importer.parseCSV(csvData);

      expect(result).toHaveProperty('MT');
      expect(result).not.toHaveProperty('ST');
      expect(result).toHaveProperty('H1');
    });

    it('デフォルト値を設定する', () => {
      const csvData = `Position,Name,Job
MT,Player1,ナイト`;

      const result = importer.parseCSV(csvData);

      expect(result.MT.dynamicPriority).toBe(0);
      expect(result.MT.policies).toBeDefined();
      expect(result.MT.weaponWish1).toBe('ナイト');
    });

    it('空のCSVの場合は空オブジェクトを返す', () => {
      const csvData = `Position,Name,Job`;

      const result = importer.parseCSV(csvData);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('前後の空白をトリミングする', () => {
      const csvData = `Position,Name,Job
  MT  ,  Player1  ,  ナイト  `;

      const result = importer.parseCSV(csvData);

      expect(result.MT.name).toBe('Player1');
      expect(result.MT.job).toBe('ナイト');
    });
  });

  describe('importPlayers', () => {
    it('パースしたプレイヤーデータをStateManagerに保存する', () => {
      const csvData = `Position,Name,Job
MT,Player1,ナイト
ST,Player2,戦士`;

      importer.importPlayers(csvData);

      const state = stateManager.getState();
      const players = state.appData.players['tier-1'];

      expect(players).toHaveProperty('MT');
      expect(players).toHaveProperty('ST');
      expect(players.MT.name).toBe('Player1');
      expect(players.ST.name).toBe('Player2');
    });

    it('既存のプレイヤーデータを上書きする', () => {
      // 既存データをセット
      stateManager.updatePlayer('tier-1', 'MT', {
        name: 'OldPlayer',
        job: '暗黒騎士',
        position: 'MT',
        dynamicPriority: 5,
        weaponWish1: '暗黒騎士武器',
        weaponWish2: '',
        policies: {
          武器: '優先',
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
      });

      const csvData = `Position,Name,Job
MT,NewPlayer,ナイト`;

      importer.importPlayers(csvData);

      const state = stateManager.getState();
      const players = state.appData.players['tier-1'];

      expect(players.MT.name).toBe('NewPlayer');
      expect(players.MT.job).toBe('ナイト');
    });

    it('レイドティアが選択されていない場合はエラーをスローする', () => {
      stateManager.setState({ currentRaidTier: null });

      const csvData = `Position,Name,Job
MT,Player1,ナイト`;

      expect(() => importer.importPlayers(csvData)).toThrow('レイドティアが選択されていません');
    });

    it('有効なプレイヤーデータがない場合はエラーをスローする', () => {
      const csvData = `Position,Name,Job`;

      expect(() => importer.importPlayers(csvData)).toThrow('有効なプレイヤーデータが見つかりません');
    });
  });

  describe('validateCSV', () => {
    it('有効なCSVの場合はtrueを返す', () => {
      const csvData = `Position,Name,Job
MT,Player1,ナイト`;

      const result = importer.validateCSV(csvData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('ヘッダーが不正な場合はエラーを返す', () => {
      const csvData = `Pos,Name,Job
MT,Player1,ナイト`;

      const result = importer.validateCSV(csvData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('CSVヘッダーが不正です。Position,Name,Jobである必要があります。');
    });

    it('空のCSVの場合はエラーを返す', () => {
      const csvData = ``;

      const result = importer.validateCSV(csvData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('CSVデータが空です');
    });

    it('データ行がない場合はエラーを返す', () => {
      const csvData = `Position,Name,Job`;

      const result = importer.validateCSV(csvData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('有効なプレイヤーデータが見つかりません');
    });
  });

  describe('getImportSummary', () => {
    it('インポート結果のサマリーを返す', () => {
      const csvData = `Position,Name,Job
MT,Player1,ナイト
ST,Player2,戦士`;

      const summary = importer.getImportSummary(csvData);

      expect(summary.totalPlayers).toBe(2);
      expect(summary.validPlayers).toBe(2);
      expect(summary.invalidRows).toBe(0);
    });

    it('不正な行をカウントする', () => {
      const csvData = `Position,Name,Job
MT,Player1,ナイト
ST,Player2
H1,Player3,白魔道士`;

      const summary = importer.getImportSummary(csvData);

      expect(summary.totalPlayers).toBe(2);
      expect(summary.validPlayers).toBe(2);
      expect(summary.invalidRows).toBe(1);
    });
  });
});
