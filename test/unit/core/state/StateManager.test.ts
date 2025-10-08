import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../../../../src/core/state/StateManager';
import type { AppState, Player, Allocation, RaidTier } from '../../../../src/types';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('初期化', () => {
    it('デフォルトの初期状態を持つ', () => {
      const state = stateManager.getState();

      expect(state.isAuthenticated).toBe(false);
      expect(state.currentTeamId).toBe(null);
      expect(state.isInitializing).toBe(false);
      expect(state.isInitialized).toBe(false);
      expect(state.selectedDirectWeapon).toBe('');
      expect(state.currentRaidTier).toBe(null);
      expect(state.appData).toEqual({
        raidTiers: {},
        players: {},
        allocations: {},
        settings: {},
        prioritySettings: {}
      });
    });

    it('部分的な初期状態で初期化できる', () => {
      const initialState: Partial<AppState> = {
        isAuthenticated: true,
        currentTeamId: 'test-team-123'
      };

      const manager = new StateManager(initialState);
      const state = manager.getState();

      expect(state.isAuthenticated).toBe(true);
      expect(state.currentTeamId).toBe('test-team-123');
    });
  });

  describe('setState', () => {
    it('状態を部分的に更新できる', () => {
      stateManager.setState({ isAuthenticated: true });

      const state = stateManager.getState();
      expect(state.isAuthenticated).toBe(true);
    });

    it('複数のプロパティを同時に更新できる', () => {
      stateManager.setState({
        isAuthenticated: true,
        currentTeamId: 'team-456',
        isInitialized: true
      });

      const state = stateManager.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentTeamId).toBe('team-456');
      expect(state.isInitialized).toBe(true);
    });

    it('リスナーに通知する', () => {
      let notified = false;
      let notifiedState: AppState | null = null;

      stateManager.subscribe((state) => {
        notified = true;
        notifiedState = state;
      });

      stateManager.setState({ isAuthenticated: true });

      expect(notified).toBe(true);
      expect(notifiedState?.isAuthenticated).toBe(true);
    });
  });

  describe('getPlayer', () => {
    it('指定されたプレイヤーを取得できる', () => {
      const player: Player = {
        name: 'テストプレイヤー',
        job: 'ナイト',
        position: 'MT',
        dynamicPriority: 0,
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
      };

      stateManager.updatePlayer('tier-1', 'MT', player);

      const result = stateManager.getPlayer('tier-1', 'MT');
      expect(result).toEqual(player);
    });

    it('存在しないプレイヤーはundefinedを返す', () => {
      const result = stateManager.getPlayer('tier-1', 'MT');
      expect(result).toBeUndefined();
    });
  });

  describe('updatePlayer', () => {
    it('プレイヤー情報を更新できる', () => {
      const player: Player = {
        name: 'プレイヤー1',
        job: '戦士',
        position: 'MT',
        dynamicPriority: 5,
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
      };

      stateManager.updatePlayer('tier-1', 'MT', player);

      const result = stateManager.getPlayer('tier-1', 'MT');
      expect(result?.name).toBe('プレイヤー1');
      expect(result?.job).toBe('戦士');
    });

    it('異なるポジションのプレイヤーを独立して管理できる', () => {
      const player1: Player = {
        name: 'MTプレイヤー',
        job: 'ナイト',
        position: 'MT',
        dynamicPriority: 0,
        policies: {
          武器: '優先', 頭: '通常', 胴: '通常', 手: '通常',
          脚: '通常', 足: '通常', 耳: '通常', 首: '通常',
          腕: '通常', 指: '通常'
        }
      };

      const player2: Player = {
        name: 'STプレイヤー',
        job: '戦士',
        position: 'ST',
        dynamicPriority: 0,
        policies: {
          武器: '優先', 頭: '通常', 胴: '通常', 手: '通常',
          脚: '通常', 足: '通常', 耳: '通常', 首: '通常',
          腕: '通常', 指: '通常'
        }
      };

      stateManager.updatePlayer('tier-1', 'MT', player1);
      stateManager.updatePlayer('tier-1', 'ST', player2);

      expect(stateManager.getPlayer('tier-1', 'MT')?.name).toBe('MTプレイヤー');
      expect(stateManager.getPlayer('tier-1', 'ST')?.name).toBe('STプレイヤー');
    });
  });

  describe('getAllocations', () => {
    it('指定されたティアの分配履歴を取得できる', () => {
      const allocation: Allocation = {
        position: 'MT',
        slot: '武器',
        layer: 4,
        week: 1,
        timestamp: new Date().toISOString()
      };

      stateManager.setState({
        appData: {
          ...stateManager.getState().appData,
          allocations: { 'MT-武器': allocation }
        }
      });

      const result = stateManager.getAllocations('tier-1');
      expect(result).toEqual([allocation]);
    });

    it('存在しないティアは空配列を返す', () => {
      const result = stateManager.getAllocations('non-existent');
      expect(result).toEqual([]);
    });
  });

  describe('addAllocation', () => {
    it('分配履歴を追加できる', () => {
      const allocation: Allocation = {
        position: 'D1',
        slot: '頭',
        layer: 2,
        week: 1,
        timestamp: new Date().toISOString()
      };

      stateManager.addAllocation('tier-1', allocation);

      const allocations = stateManager.getAllocations('tier-1');
      expect(allocations).toHaveLength(1);
      expect(allocations[0]).toEqual(allocation);
    });

    it('既存の分配履歴に追加できる', () => {
      const allocation1: Allocation = {
        position: 'MT',
        slot: '武器',
        layer: 4,
        week: 1,
        timestamp: new Date().toISOString()
      };

      const allocation2: Allocation = {
        position: 'D1',
        slot: '頭',
        layer: 2,
        week: 1,
        timestamp: new Date().toISOString()
      };

      stateManager.addAllocation('tier-1', allocation1);
      stateManager.addAllocation('tier-1', allocation2);

      const allocations = stateManager.getAllocations('tier-1');
      expect(allocations).toHaveLength(2);
    });
  });

  describe('subscribe', () => {
    it('リスナーを登録できる', () => {
      let callCount = 0;

      stateManager.subscribe(() => {
        callCount++;
      });

      stateManager.setState({ isAuthenticated: true });

      expect(callCount).toBe(1);
    });

    it('複数のリスナーを登録できる', () => {
      let callCount1 = 0;
      let callCount2 = 0;

      stateManager.subscribe(() => { callCount1++; });
      stateManager.subscribe(() => { callCount2++; });

      stateManager.setState({ isAuthenticated: true });

      expect(callCount1).toBe(1);
      expect(callCount2).toBe(1);
    });

    it('リスナーの登録を解除できる', () => {
      let callCount = 0;

      const unsubscribe = stateManager.subscribe(() => {
        callCount++;
      });

      stateManager.setState({ isAuthenticated: true });
      expect(callCount).toBe(1);

      unsubscribe();

      stateManager.setState({ isAuthenticated: false });
      expect(callCount).toBe(1); // 増加しない
    });
  });

  describe('getState', () => {
    it('読み取り専用の状態を返す', () => {
      const state = stateManager.getState();

      // TypeScriptでは型安全性により書き込みできないが、実行時チェックも行う
      expect(() => {
        (state as any).isAuthenticated = true;
      }).toThrow();
    });
  });
});
