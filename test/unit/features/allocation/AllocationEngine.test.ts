import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AllocationEngine } from '../../../../src/features/allocation/AllocationEngine';
import { PriorityCalculator } from '../../../../src/features/allocation/PriorityCalculator';
import { StateManager } from '../../../../src/core/state/StateManager';
import type { Player, Drop, Allocation, AllocationResult } from '../../../../src/types';

describe('AllocationEngine', () => {
  let engine: AllocationEngine;
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
      currentRaidTier: { id: 'tier-1', name: 'Test Tier', createdAt: '2025-01-01' },
      appData: {
        raidTiers: {
          'tier-1': { id: 'tier-1', name: 'Test Tier', createdAt: '2025-01-01' }
        },
        players: {},
        allocations: {},
        settings: {},
        prioritySettings: {}
      }
    });
    calculator = new PriorityCalculator(stateManager);
    engine = new AllocationEngine(stateManager, calculator);
  });

  describe('processLayer', () => {
    it('1層のドロップアイテムを正しく処理する', () => {
      const player1 = createTestPlayer({
        name: 'プレイヤー1',
        position: 'MT',
        policies: { ...createTestPlayer().policies, 耳: '優先' }
      });
      const player2 = createTestPlayer({
        name: 'プレイヤー2',
        position: 'ST',
        policies: { ...createTestPlayer().policies, 耳: '通常' }
      });

      stateManager.updatePlayer('tier-1', 'MT', player1);
      stateManager.updatePlayer('tier-1', 'ST', player2);

      const results = engine.processLayer(1);

      expect(results).toHaveProperty('耳');
      expect(results).toHaveProperty('首');
      expect(results).toHaveProperty('腕');
      expect(results).toHaveProperty('指');
    });

    it('2層のドロップアイテムを正しく処理する', () => {
      const player = createTestPlayer();
      stateManager.updatePlayer('tier-1', 'MT', player);

      const results = engine.processLayer(2);

      expect(results).toHaveProperty('頭');
      expect(results).toHaveProperty('手');
      expect(results).toHaveProperty('足');
      expect(results).toHaveProperty('武器石');
      expect(results).toHaveProperty('硬化薬');
    });

    it('3層のドロップアイテムを正しく処理する', () => {
      const player = createTestPlayer();
      stateManager.updatePlayer('tier-1', 'MT', player);

      const results = engine.processLayer(3);

      expect(results).toHaveProperty('胴');
      expect(results).toHaveProperty('脚');
      expect(results).toHaveProperty('強化薬');
      expect(results).toHaveProperty('強化繊維');
    });

    it('4層のドロップアイテムを正しく処理する', () => {
      const player = createTestPlayer();
      stateManager.updatePlayer('tier-1', 'MT', player);

      const results = engine.processLayer(4);

      expect(results).toHaveProperty('胴');
      expect(results).toHaveProperty('武器箱');
      expect(results).toHaveProperty('直ドロップ武器');
    });
  });

  describe('findCandidates', () => {
    it('優先度順に候補者をソートする', () => {
      const player1 = createTestPlayer({
        name: 'プレイヤー1',
        position: 'MT',
        policies: { ...createTestPlayer().policies, 頭: '通常' }
      });
      const player2 = createTestPlayer({
        name: 'プレイヤー2',
        position: 'ST',
        policies: { ...createTestPlayer().policies, 頭: '優先' }
      });

      stateManager.updatePlayer('tier-1', 'MT', player1);
      stateManager.updatePlayer('tier-1', 'ST', player2);

      const drop: Drop = {
        name: '頭装備',
        slot: '頭',
        type: 'equipment'
      };

      const candidates = engine.findCandidates(drop);

      expect(candidates.length).toBe(2);
      expect(candidates[0].position).toBe('ST'); // 優先ポリシーが先
      expect(candidates[1].position).toBe('MT');
    });

    it('canReceiveがfalseの候補者も含める', () => {
      const player1 = createTestPlayer({
        name: 'プレイヤー1',
        position: 'MT',
        policies: { ...createTestPlayer().policies, 頭: '最後' }
      });

      stateManager.updatePlayer('tier-1', 'MT', player1);

      const drop: Drop = {
        name: '頭装備',
        slot: '頭',
        type: 'equipment'
      };

      const candidates = engine.findCandidates(drop);

      expect(candidates.length).toBe(1);
      expect(candidates[0].canReceive).toBe(false);
    });
  });

  describe('selectWinner', () => {
    it('取得可能な候補者から最優先者を選出する', () => {
      const drop: Drop = {
        name: '頭装備',
        slot: '頭',
        type: 'equipment'
      };

      const player1 = createTestPlayer({
        name: 'プレイヤー1',
        position: 'MT',
        policies: { ...createTestPlayer().policies, 頭: '通常' }
      });
      const player2 = createTestPlayer({
        name: 'プレイヤー2',
        position: 'ST',
        policies: { ...createTestPlayer().policies, 頭: '優先' }
      });

      stateManager.updatePlayer('tier-1', 'MT', player1);
      stateManager.updatePlayer('tier-1', 'ST', player2);

      const candidates = engine.findCandidates(drop);
      const result = engine.selectWinner(drop, candidates);

      expect(result.recommended).not.toBeNull();
      expect(result.recommended?.position).toBe('ST');
      expect(result.isMultipleRecommended).toBe(false);
    });

    it('取得可能な候補者がいない場合はrecommendedがnull', () => {
      const drop: Drop = {
        name: '頭装備',
        slot: '頭',
        type: 'equipment'
      };

      const player = createTestPlayer({
        policies: { ...createTestPlayer().policies, 頭: '最後' }
      });

      stateManager.updatePlayer('tier-1', 'MT', player);

      const candidates = engine.findCandidates(drop);
      const result = engine.selectWinner(drop, candidates);

      expect(result.recommended).toBeNull();
    });

    it('直ドロップ武器：第一希望者がいる場合は最優先', () => {
      const drop: Drop = {
        name: 'ナイト武器',
        slot: '直ドロップ武器',
        type: 'direct_weapon',
        weapon: 'ナイト武器'
      };

      const player1 = createTestPlayer({
        name: 'プレイヤー1',
        position: 'MT',
        weaponWish1: 'ナイト武器',
        weaponWish2: '戦士武器'
      });
      const player2 = createTestPlayer({
        name: 'プレイヤー2',
        position: 'ST',
        weaponWish1: '暗黒騎士武器',
        weaponWish2: 'ナイト武器'
      });

      stateManager.updatePlayer('tier-1', 'MT', player1);
      stateManager.updatePlayer('tier-1', 'ST', player2);

      const candidates = engine.findCandidates(drop);
      const result = engine.selectWinner(drop, candidates);

      expect(result.recommended?.position).toBe('MT');
      expect(result.isMultipleRecommended).toBe(false);
    });

    it('直ドロップ武器：第一希望者がいない場合、第二希望者が複数なら複数推奨', () => {
      const drop: Drop = {
        name: 'ナイト武器',
        slot: '直ドロップ武器',
        type: 'direct_weapon',
        weapon: 'ナイト武器'
      };

      const player1 = createTestPlayer({
        name: 'プレイヤー1',
        position: 'MT',
        weaponWish1: '暗黒騎士武器',
        weaponWish2: 'ナイト武器'
      });
      const player2 = createTestPlayer({
        name: 'プレイヤー2',
        position: 'ST',
        weaponWish1: '戦士武器',
        weaponWish2: 'ナイト武器'
      });

      stateManager.updatePlayer('tier-1', 'MT', player1);
      stateManager.updatePlayer('tier-1', 'ST', player2);

      const candidates = engine.findCandidates(drop);
      const result = engine.selectWinner(drop, candidates);

      expect(result.isMultipleRecommended).toBe(true);
      expect(result.multipleRecommended).toHaveLength(2);
      expect(result.recommended).toBeNull();
    });

    it('直ドロップ武器：希望者が1人の第二希望者なら単一推奨', () => {
      const drop: Drop = {
        name: 'ナイト武器',
        slot: '直ドロップ武器',
        type: 'direct_weapon',
        weapon: 'ナイト武器'
      };

      const player1 = createTestPlayer({
        name: 'プレイヤー1',
        position: 'MT',
        weaponWish1: '暗黒騎士武器',
        weaponWish2: 'ナイト武器'
      });
      const player2 = createTestPlayer({
        name: 'プレイヤー2',
        position: 'ST',
        weaponWish1: '戦士武器',
        weaponWish2: 'ガンブレイカー武器'
      });

      stateManager.updatePlayer('tier-1', 'MT', player1);
      stateManager.updatePlayer('tier-1', 'ST', player2);

      const candidates = engine.findCandidates(drop);
      const result = engine.selectWinner(drop, candidates);

      expect(result.recommended?.position).toBe('MT');
      expect(result.isMultipleRecommended).toBe(false);
    });
  });

  describe('confirmAllocations', () => {
    it('分配結果を保存する', () => {
      const results: Record<string, AllocationResult> = {
        '頭': {
          drop: { name: '頭装備', slot: '頭', type: 'equipment' },
          candidates: [],
          recommended: {
            position: 'MT',
            player: createTestPlayer(),
            priority: 1000,
            reason: 'Need (優先)',
            type: 'need',
            canReceive: true
          },
          isMultipleRecommended: false
        }
      };

      const selectedAllocations = { '頭': 'MT' };

      engine.confirmAllocations(1, 1, results, selectedAllocations);

      const state = stateManager.getState();
      const allocations = Object.values(state.appData.allocations);

      expect(allocations).toHaveLength(1);
      expect(allocations[0].position).toBe('MT');
      expect(allocations[0].slot).toBe('頭');
      expect(allocations[0].layer).toBe(1);
      expect(allocations[0].week).toBe(1);
    });

    it('選択されていないアイテムは保存しない', () => {
      const results: Record<string, AllocationResult> = {
        '頭': {
          drop: { name: '頭装備', slot: '頭', type: 'equipment' },
          candidates: [],
          recommended: null,
          isMultipleRecommended: false
        }
      };

      const selectedAllocations = {};

      engine.confirmAllocations(1, 1, results, selectedAllocations);

      const state = stateManager.getState();
      const allocations = Object.values(state.appData.allocations);

      expect(allocations).toHaveLength(0);
    });

    it('複数のアイテムを同時に保存できる', () => {
      const results: Record<string, AllocationResult> = {
        '頭': {
          drop: { name: '頭装備', slot: '頭', type: 'equipment' },
          candidates: [],
          recommended: {
            position: 'MT',
            player: createTestPlayer({ position: 'MT' }),
            priority: 1000,
            reason: 'Need',
            type: 'need',
            canReceive: true
          },
          isMultipleRecommended: false
        },
        '手': {
          drop: { name: '手装備', slot: '手', type: 'equipment' },
          candidates: [],
          recommended: {
            position: 'ST',
            player: createTestPlayer({ position: 'ST' }),
            priority: 900,
            reason: 'Need',
            type: 'need',
            canReceive: true
          },
          isMultipleRecommended: false
        }
      };

      const selectedAllocations = { '頭': 'MT', '手': 'ST' };

      engine.confirmAllocations(2, 1, results, selectedAllocations);

      const state = stateManager.getState();
      const allocations = Object.values(state.appData.allocations);

      expect(allocations).toHaveLength(2);
      expect(allocations.find(a => a.slot === '頭')?.position).toBe('MT');
      expect(allocations.find(a => a.slot === '手')?.position).toBe('ST');
    });
  });
});
