import type { StateManager } from '../../core/state/StateManager';
import type { PriorityCalculator } from './PriorityCalculator';
import type { Drop, AllocationResult, AllocationCandidate, Allocation } from '../../types';
import { LAYER_DROPS } from '../../config/constants';

/**
 * 分配エンジン
 */
export class AllocationEngine {
  private stateManager: StateManager;
  private priorityCalculator: PriorityCalculator;

  constructor(stateManager: StateManager, priorityCalculator: PriorityCalculator) {
    this.stateManager = stateManager;
    this.priorityCalculator = priorityCalculator;
  }

  /**
   * 層別の分配処理
   */
  processLayer(layer: number): Record<string, AllocationResult> {
    const drops = this.getLayerDrops(layer);
    const results: Record<string, AllocationResult> = {};

    drops.forEach(drop => {
      const candidates = this.findCandidates(drop);
      const result = this.selectWinner(drop, candidates);
      results[drop.slot] = result;
    });

    return results;
  }

  /**
   * 層別ドロップアイテムを取得
   */
  private getLayerDrops(layer: number): Drop[] {
    const state = this.stateManager.getState();
    const selectedDirectWeapon = state.appData.settings?.selectedDirectWeapon;

    // LAYER_DROPSから取得
    const drops = LAYER_DROPS[layer as keyof typeof LAYER_DROPS] || [];

    // 4層の直ドロップ武器の場合、選択された武器を設定
    return drops.map((drop: Drop) => {
      if (drop.type === 'direct_weapon') {
        return {
          ...drop,
          weapon: (selectedDirectWeapon as string) || null
        };
      }
      return drop;
    });
  }

  /**
   * 分配候補者を検索
   */
  findCandidates(drop: Drop): AllocationCandidate[] {
    const state = this.stateManager.getState();
    const currentRaidTier = state.currentRaidTier;
    if (!currentRaidTier) return [];

    const players = state.appData.players[currentRaidTier.id] || {};
    const allocations = state.appData.allocations[currentRaidTier.id] || [];
    const candidates: AllocationCandidate[] = [];

    for (const [position, player] of Object.entries(players)) {
      const priority = this.priorityCalculator.calculatePriority(
        player,
        position as any,
        drop,
        allocations
      );

      candidates.push({
        position: position as any,
        player,
        priority: priority.score,
        reason: priority.reason,
        type: priority.type,
        canReceive: priority.canReceive
      });
    }

    // 優先度順でソート
    candidates.sort((a, b) => b.priority - a.priority);

    return candidates;
  }

  /**
   * 勝者を選定
   */
  selectWinner(drop: Drop, candidates: AllocationCandidate[]): AllocationResult {
    // 取得可能な候補者のみ抽出
    const eligibleCandidates = candidates.filter(c => c.canReceive);

    // 直ドロップ武器の特別処理
    if (drop.type === 'direct_weapon' && drop.weapon) {
      return this.selectDirectWeaponWinner(drop, candidates, eligibleCandidates);
    }

    // 通常の装備・素材処理
    return {
      drop,
      candidates,
      recommended: eligibleCandidates[0] || null,
      isMultipleRecommended: false
    };
  }

  /**
   * 直ドロップ武器の勝者選定
   */
  private selectDirectWeaponWinner(
    drop: Drop,
    allCandidates: AllocationCandidate[],
    eligibleCandidates: AllocationCandidate[]
  ): AllocationResult {
    // 第一希望者を探す
    const firstChoiceCandidates = eligibleCandidates.filter(c => {
      return c.player.weaponWish1 === drop.weapon;
    });

    if (firstChoiceCandidates.length > 0) {
      // 第一希望者がいる場合は最優先者のみ
      return {
        drop,
        candidates: allCandidates,
        recommended: firstChoiceCandidates[0],
        isMultipleRecommended: false
      };
    }

    // 第一希望者がいない場合、第二希望以降をチェック
    const otherChoiceCandidates = eligibleCandidates.filter(c => {
      const wish1 = c.player.weaponWish1;
      const wish2 = c.player.weaponWish2;
      return (wish2 === drop.weapon && wish1 !== drop.weapon) ||
             (wish1 !== drop.weapon && wish2 !== drop.weapon &&
              (wish1 === drop.weapon || wish2 === drop.weapon));
    });

    if (otherChoiceCandidates.length > 1) {
      // 複数の第二希望以降がある場合
      return {
        drop,
        candidates: allCandidates,
        recommended: null,
        multipleRecommended: otherChoiceCandidates,
        isMultipleRecommended: true
      };
    } else if (otherChoiceCandidates.length === 1) {
      // 単一の第二希望以降
      return {
        drop,
        candidates: allCandidates,
        recommended: otherChoiceCandidates[0],
        isMultipleRecommended: false
      };
    }

    // 希望者がいない
    return {
      drop,
      candidates: allCandidates,
      recommended: null,
      isMultipleRecommended: false
    };
  }

  /**
   * 分配結果を確定
   */
  confirmAllocations(
    layer: number,
    week: number,
    results: Record<string, AllocationResult>,
    selectedAllocations: Record<string, string>
  ): void {
    const state = this.stateManager.getState();
    const currentRaidTier = state.currentRaidTier;
    if (!currentRaidTier) return;

    const allocations: Allocation[] = [];

    for (const [slot, position] of Object.entries(selectedAllocations)) {
      if (!position) continue;

      const result = results[slot];
      if (!result) continue;

      const allocation: Allocation = {
        position: position as any,
        slot: slot as any,
        layer: layer as any,
        week,
        timestamp: new Date().toISOString(),
        status: '取得済'
      };

      // 直ドロップ武器の場合は武器名も保存
      if (result.drop.type === 'direct_weapon' && result.drop.weapon) {
        allocation.weapon = result.drop.weapon;
      }

      allocations.push(allocation);
    }

    // StateManagerを通じて保存
    allocations.forEach(allocation => {
      this.stateManager.addAllocation(currentRaidTier.id, allocation);
    });
  }
}
