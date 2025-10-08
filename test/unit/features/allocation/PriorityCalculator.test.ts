import { describe, it, expect, beforeEach } from 'vitest';
import { PriorityCalculator } from '../../../../src/features/allocation/PriorityCalculator';
import { StateManager } from '../../../../src/core/state/StateManager';
import type { Player, Drop, Allocation } from '../../../../src/types';

describe('PriorityCalculator', () => {
  let calculator: PriorityCalculator;
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
      currentRaidTier: { id: 'tier-1', name: 'Test Tier', createdAt: '2025-01-01' }
    });
    calculator = new PriorityCalculator(stateManager);
  });

  describe('装備の優先度計算', () => {
    const equipmentDrop: Drop = {
      name: '頭装備',
      slot: '頭',
      type: 'equipment'
    };

    it('優先ポリシー・未取得の場合は高優先度', () => {
      const player = createTestPlayer({
        policies: { ...createTestPlayer().policies, 頭: '優先' }
      });

      const result = calculator.calculatePriority(player, 'MT', equipmentDrop, []);

      expect(result.canReceive).toBe(true);
      expect(result.type).toBe('need');
      expect(result.score).toBeGreaterThan(1000);
      expect(result.reason).toContain('Need');
    });

    it('通常ポリシー・未取得の場合は中優先度', () => {
      const player = createTestPlayer({
        policies: { ...createTestPlayer().policies, 頭: '通常' }
      });

      const result = calculator.calculatePriority(player, 'MT', equipmentDrop, []);

      expect(result.canReceive).toBe(true);
      expect(result.type).toBe('greed');
      expect(result.score).toBeGreaterThan(500);
      expect(result.score).toBeLessThan(1000);
    });

    it('最後ポリシーの場合は分配対象外', () => {
      const player = createTestPlayer({
        policies: { ...createTestPlayer().policies, 頭: '最後' }
      });

      const result = calculator.calculatePriority(player, 'MT', equipmentDrop, []);

      expect(result.canReceive).toBe(false);
      expect(result.type).toBe('pass');
    });

    it('取得済みの場合は分配対象外', () => {
      const player = createTestPlayer();
      const allocations: Allocation[] = [{
        position: 'MT',
        slot: '頭',
        layer: 2,
        week: 1,
        timestamp: '2025-01-01',
        status: '取得済'
      }];

      const result = calculator.calculatePriority(player, 'MT', equipmentDrop, allocations);

      expect(result.canReceive).toBe(false);
      expect(result.type).toBe('pass');
      expect(result.reason).toContain('所持済み');
    });

    it('断章交換済みで未取得者がいる場合は分配対象外', () => {
      const player1 = createTestPlayer({ position: 'MT' });
      const player2 = createTestPlayer({
        position: 'ST',
        policies: { ...createTestPlayer().policies, 頭: '優先' }
      });

      stateManager.updatePlayer('tier-1', 'MT', player1);
      stateManager.updatePlayer('tier-1', 'ST', player2);

      const allocations: Allocation[] = [{
        position: 'MT',
        slot: '頭',
        layer: 2,
        week: 1,
        timestamp: '2025-01-01',
        status: '断章交換'
      }];

      const result = calculator.calculatePriority(player1, 'MT', equipmentDrop, allocations);

      expect(result.canReceive).toBe(false);
      expect(result.type).toBe('pass');
      expect(result.reason).toContain('他に未取得者あり');
    });

    it('断章交換済みで未取得者がいない場合は復活', () => {
      const player = createTestPlayer();

      const allocations: Allocation[] = [{
        position: 'MT',
        slot: '頭',
        layer: 2,
        week: 1,
        timestamp: '2025-01-01',
        status: '断章交換'
      }];

      const result = calculator.calculatePriority(player, 'MT', equipmentDrop, allocations);

      expect(result.canReceive).toBe(true);
      expect(result.type).toBe('need');
      expect(result.reason).toContain('復活');
    });
  });

  describe('武器箱の優先度計算', () => {
    const weaponBoxDrop: Drop = {
      name: '武器箱',
      slot: '武器箱',
      type: 'weapon_box'
    };

    it('優先ポリシー・未取得の場合は最高優先度', () => {
      const player = createTestPlayer({
        policies: { ...createTestPlayer().policies, 武器: '優先' }
      });

      const result = calculator.calculatePriority(player, 'MT', weaponBoxDrop, []);

      expect(result.canReceive).toBe(true);
      expect(result.type).toBe('need');
      expect(result.score).toBeGreaterThan(2000);
    });

    it('取得済みの場合は分配対象外', () => {
      const player = createTestPlayer();
      const allocations: Allocation[] = [{
        position: 'MT',
        slot: '武器箱',
        layer: 4,
        week: 1,
        timestamp: '2025-01-01'
      }];

      const result = calculator.calculatePriority(player, 'MT', weaponBoxDrop, allocations);

      expect(result.canReceive).toBe(false);
      expect(result.type).toBe('pass');
    });
  });

  describe('直ドロップ武器の優先度計算', () => {
    const directWeaponDrop: Drop = {
      name: 'ナイト武器',
      slot: '直ドロップ武器',
      type: 'direct_weapon',
      weapon: 'ナイト武器'
    };

    it('第一希望武器の場合は最高優先度', () => {
      const player = createTestPlayer({
        weaponWish1: 'ナイト武器'
      });

      const result = calculator.calculatePriority(player, 'MT', directWeaponDrop, []);

      expect(result.canReceive).toBe(true);
      expect(result.type).toBe('need');
      expect(result.score).toBeGreaterThan(3000);
      expect(result.reason).toContain('第1希望');
    });

    it('第二希望武器の場合は高優先度', () => {
      const player = createTestPlayer({
        weaponWish1: '戦士武器',
        weaponWish2: 'ナイト武器'
      });

      const result = calculator.calculatePriority(player, 'MT', directWeaponDrop, []);

      expect(result.canReceive).toBe(true);
      expect(result.type).toBe('need');
      expect(result.reason).toContain('第2希望');
    });

    it('希望していない武器の場合は分配対象外', () => {
      const player = createTestPlayer({
        weaponWish1: '戦士武器',
        weaponWish2: '暗黒騎士武器'
      });

      const result = calculator.calculatePriority(player, 'MT', directWeaponDrop, []);

      expect(result.canReceive).toBe(false);
      expect(result.type).toBe('pass');
      expect(result.reason).toContain('希望なし');
    });

    it('第一希望武器取得済みの場合は分配対象外', () => {
      const player = createTestPlayer();
      const allocations: Allocation[] = [{
        position: 'MT',
        slot: '第一希望武器',
        layer: 4,
        week: 1,
        timestamp: '2025-01-01'
      }];

      const result = calculator.calculatePriority(player, 'MT', directWeaponDrop, allocations);

      expect(result.canReceive).toBe(false);
      expect(result.type).toBe('pass');
    });
  });

  describe('素材の優先度計算', () => {
    const materialDrop: Drop = {
      name: '武器石',
      slot: '武器石',
      type: 'material'
    };

    it('未取得の場合は分配対象', () => {
      const player = createTestPlayer();

      const result = calculator.calculatePriority(player, 'MT', materialDrop, []);

      expect(result.canReceive).toBe(true);
      expect(result.type).toBe('need');
    });

    it('取得済みの場合は分配対象外', () => {
      const player = createTestPlayer();
      const allocations: Allocation[] = [{
        position: 'MT',
        slot: '武器石',
        layer: 2,
        week: 1,
        timestamp: '2025-01-01'
      }];

      const result = calculator.calculatePriority(player, 'MT', materialDrop, allocations);

      expect(result.canReceive).toBe(false);
      expect(result.type).toBe('pass');
    });
  });

  describe('動的優先度の影響', () => {
    const equipmentDrop: Drop = {
      name: '頭装備',
      slot: '頭',
      type: 'equipment'
    };

    it('動的優先度が高いほどスコアが下がる', () => {
      const player1 = createTestPlayer({ dynamicPriority: 0 });
      const player2 = createTestPlayer({ dynamicPriority: 10 });

      const result1 = calculator.calculatePriority(player1, 'MT', equipmentDrop, []);
      const result2 = calculator.calculatePriority(player2, 'ST', equipmentDrop, []);

      expect(result1.score).toBeGreaterThan(result2.score);
    });
  });
});
