import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataExporter } from '../../../../src/features/export/DataExporter';
import { StateManager } from '../../../../src/core/state/StateManager';
import type { Player, Allocation } from '../../../../src/types';

describe('DataExporter', () => {
  let exporter: DataExporter;
  let stateManager: StateManager;

  const createTestPlayer = (overrides?: Partial<Player>): Player => ({
    name: 'テストプレイヤー',
    job: 'ナイト',
    position: 'MT',
    dynamicPriority: 0,
    weaponWish1: 'ナイト武器',
    weaponWish2: '戦士武器',
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
    },
    ...overrides
  });

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
          'tier-1': {
            'MT': createTestPlayer({ position: 'MT', name: 'Player1' }),
            'ST': createTestPlayer({ position: 'ST', name: 'Player2' })
          }
        },
        allocations: {
          'tier-1': [
            {
              position: 'MT',
              slot: '頭',
              layer: 2,
              week: 1,
              timestamp: '2025-01-01T00:00:00.000Z',
              status: '取得済'
            }
          ]
        },
        settings: {},
        prioritySettings: {}
      }
    });
    exporter = new DataExporter(stateManager);
  });

  describe('exportToJSON', () => {
    it('現在のレイドティアのデータをJSON形式でエクスポートする', () => {
      const result = exporter.exportToJSON();

      expect(result).toHaveProperty('teamId', 'team-123');
      expect(result).toHaveProperty('tier');
      expect(result.tier).toEqual({ id: 'tier-1', name: 'Test Tier', createdAt: '2025-01-01' });
      expect(result).toHaveProperty('players');
      expect(result).toHaveProperty('allocations');
      expect(result).toHaveProperty('exportDate');
    });

    it('プレイヤーデータを含む', () => {
      const result = exporter.exportToJSON();

      expect(result.players).toHaveProperty('MT');
      expect(result.players).toHaveProperty('ST');
      expect(result.players.MT.name).toBe('Player1');
      expect(result.players.ST.name).toBe('Player2');
    });

    it('分配履歴を含む', () => {
      const result = exporter.exportToJSON();

      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0].position).toBe('MT');
      expect(result.allocations[0].slot).toBe('頭');
    });

    it('レイドティアが選択されていない場合はエラーをスローする', () => {
      stateManager.setState({ currentRaidTier: null });

      expect(() => exporter.exportToJSON()).toThrow('レイドティアが選択されていません');
    });

    it('エクスポート日時が含まれる', () => {
      const result = exporter.exportToJSON();

      expect(result.exportDate).toBeDefined();
      expect(new Date(result.exportDate)).toBeInstanceOf(Date);
    });
  });

  describe('generateJSONFile', () => {
    it('JSON文字列を生成する', () => {
      const jsonString = exporter.generateJSONFile();

      expect(() => JSON.parse(jsonString)).not.toThrow();
      const parsed = JSON.parse(jsonString);
      expect(parsed).toHaveProperty('teamId');
      expect(parsed).toHaveProperty('tier');
    });

    it('整形されたJSONを生成する（インデント2）', () => {
      const jsonString = exporter.generateJSONFile();

      expect(jsonString).toContain('\n');
      expect(jsonString).toContain('  ');
    });
  });

  describe('downloadJSON', () => {
    it('ダウンロードリンクを作成する', () => {
      // モック設定
      const mockCreateElement = vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn()
      }));
      const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
      const mockRevokeObjectURL = vi.fn();

      global.document.createElement = mockCreateElement as any;
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      exporter.downloadJSON();

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('ファイル名に日付が含まれる', () => {
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      const mockCreateElement = vi.fn(() => mockLink);

      global.document.createElement = mockCreateElement as any;
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      exporter.downloadJSON();

      expect(mockLink.download).toContain('ff14_gear_allocation');
      expect(mockLink.download).toContain('tier-1');
      expect(mockLink.download).toContain('.json');
    });
  });

  describe('exportToCSV', () => {
    it('プレイヤーデータをCSV形式でエクスポートする', () => {
      const csv = exporter.exportToCSV();

      expect(csv).toContain('Position,Name,Job');
      expect(csv).toContain('MT,Player1,ナイト');
      expect(csv).toContain('ST,Player2,ナイト');
    });

    it('ヘッダー行が含まれる', () => {
      const csv = exporter.exportToCSV();
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Position,Name,Job');
    });

    it('プレイヤーがいない場合はヘッダーのみ', () => {
      stateManager.setState({
        currentRaidTier: { id: 'tier-1', name: 'Test Tier', createdAt: '2025-01-01' },
        appData: {
          ...stateManager.getState().appData,
          players: { 'tier-1': {} }
        }
      });

      const csv = exporter.exportToCSV();
      const lines = csv.split('\n').filter(l => l.trim());

      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('Position,Name,Job');
    });
  });

  describe('downloadCSV', () => {
    it('CSVファイルをダウンロードする', () => {
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      const mockCreateElement = vi.fn(() => mockLink);

      global.document.createElement = mockCreateElement as any;
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      exporter.downloadCSV();

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toContain('.csv');
    });
  });
});
