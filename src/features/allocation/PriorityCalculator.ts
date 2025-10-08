import type { StateManager } from '../../core/state/StateManager';
import type { Player, Drop, Allocation, Position, Policy, PlayerMap } from '../../types';

/**
 * 優先度計算結果
 */
export interface PriorityResult {
  canReceive: boolean;
  score: number;
  reason: string;
  type: 'need' | 'greed' | 'pass';
}

/**
 * 優先度計算クラス
 */
export class PriorityCalculator {
  private stateManager: StateManager;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  /**
   * プレイヤーの優先度を計算
   */
  calculatePriority(
    player: Player,
    position: Position,
    drop: Drop,
    allocations: Allocation[]
  ): PriorityResult {
    let score = 0;
    let canReceive = false;
    let reason = 'Pass';
    let type: 'need' | 'greed' | 'pass' = 'pass';

    if (drop.type === 'equipment') {
      return this.calculateEquipmentPriority(player, position, drop, allocations);
    } else if (drop.type === 'material') {
      return this.calculateMaterialPriority(player, position, drop, allocations);
    } else if (drop.type === 'weapon_box') {
      return this.calculateWeaponBoxPriority(player, position, drop, allocations);
    } else if (drop.type === 'direct_weapon') {
      return this.calculateDirectWeaponPriority(player, position, drop, allocations);
    }

    return { canReceive, score, reason, type };
  }

  /**
   * 装備の優先度計算
   */
  private calculateEquipmentPriority(
    player: Player,
    position: Position,
    drop: Drop,
    allocations: Allocation[]
  ): PriorityResult {
    const policy = player.policies[drop.slot as keyof typeof player.policies] || '通常';
    const equipmentStatus = this.getPlayerEquipmentStatus(position, drop.slot, allocations);

    // 断章交換・箱取得済は完全に分配対象外
    if (equipmentStatus === '断章交換・箱取得済') {
      return {
        canReceive: false,
        score: 0,
        reason: 'Pass (断章交換・箱取得済)',
        type: 'pass'
      };
    }

    // 断章交換者の特別処理
    if (equipmentStatus === '断章交換') {
      const hasUnacquired = this.hasUnacquiredRaidPlayers(drop.slot, position, allocations);

      if (hasUnacquired) {
        return {
          canReceive: false,
          score: 0,
          reason: 'Pass (断章交換 - 他に未取得者あり)',
          type: 'pass'
        };
      } else {
        // 未取得者がいない場合は復活
        return {
          canReceive: true,
          score: 1000 + this.getPositionPriority(position) - (player.dynamicPriority || 0),
          reason: 'Need (断章交換 - 復活)',
          type: 'need'
        };
      }
    }

    // 取得済みの場合
    if (equipmentStatus !== '未取得') {
      return {
        canReceive: false,
        score: 0,
        reason: 'Pass (所持済み)',
        type: 'pass'
      };
    }

    // ポリシー別処理
    if (policy === '優先') {
      return {
        canReceive: true,
        score: 1000 + this.getPositionPriority(position) - (player.dynamicPriority || 0),
        reason: 'Need (優先)',
        type: 'need'
      };
    } else if (policy === '通常') {
      return {
        canReceive: true,
        score: 500 + this.getPositionPriority(position) - (player.dynamicPriority || 0),
        reason: 'Greed (通常)',
        type: 'greed'
      };
    } else {
      // '最後'の場合
      return {
        canReceive: false,
        score: 0,
        reason: 'Pass (最後)',
        type: 'pass'
      };
    }
  }

  /**
   * 武器箱の優先度計算
   */
  private calculateWeaponBoxPriority(
    player: Player,
    position: Position,
    drop: Drop,
    allocations: Allocation[]
  ): PriorityResult {
    const weaponBoxStatus = this.getPlayerEquipmentStatus(position, '武器箱', allocations);
    const weaponPolicy = player.policies['武器'] || '通常';

    // 断章交換・箱取得済は完全に分配対象外
    if (weaponBoxStatus === '断章交換・箱取得済') {
      return {
        canReceive: false,
        score: 0,
        reason: 'Pass (断章交換・箱取得済)',
        type: 'pass'
      };
    }

    // 断章交換者の特別処理
    if (weaponBoxStatus === '断章交換') {
      const hasUnacquired = this.hasUnacquiredWeaponBoxPlayers(position, allocations);

      if (hasUnacquired) {
        return {
          canReceive: false,
          score: 0,
          reason: 'Pass (断章交換 - 他に未取得者あり)',
          type: 'pass'
        };
      } else {
        return {
          canReceive: true,
          score: 2000 + this.getPositionPriority(position) - (player.dynamicPriority || 0),
          reason: 'Need (断章交換 - 復活)',
          type: 'need'
        };
      }
    }

    // 取得済みの場合
    if (weaponBoxStatus !== '未取得') {
      return {
        canReceive: false,
        score: 0,
        reason: 'Pass (武器箱取得済み)',
        type: 'pass'
      };
    }

    // ポリシー別処理
    if (weaponPolicy === '優先') {
      return {
        canReceive: true,
        score: 2000 + this.getPositionPriority(position) - (player.dynamicPriority || 0),
        reason: 'Need (武器箱)',
        type: 'need'
      };
    } else {
      return {
        canReceive: true,
        score: 500 + this.getPositionPriority(position) - (player.dynamicPriority || 0),
        reason: 'Greed (武器箱 - 通常)',
        type: 'greed'
      };
    }
  }

  /**
   * 直ドロップ武器の優先度計算
   */
  private calculateDirectWeaponPriority(
    player: Player,
    position: Position,
    drop: Drop,
    allocations: Allocation[]
  ): PriorityResult {
    const firstChoiceWeaponStatus = this.getPlayerEquipmentStatus(position, '第一希望武器', allocations);
    const weaponType = drop.weapon;

    // 第一希望武器を既に取得済みの場合はPass
    if (firstChoiceWeaponStatus === '取得済' || firstChoiceWeaponStatus === '取得済み') {
      return {
        canReceive: false,
        score: 0,
        reason: 'Pass (第一希望武器取得済み)',
        type: 'pass'
      };
    }

    // 武器希望をチェック
    const weaponWishes: string[] = [];
    if (player.weaponWish1) weaponWishes.push(player.weaponWish1);
    if (player.weaponWish2) weaponWishes.push(player.weaponWish2);

    if (weaponType && weaponWishes.includes(weaponType)) {
      const wishIndex = weaponWishes.indexOf(weaponType);
      return {
        canReceive: true,
        score: 3000 + this.getPositionPriority(position) - (wishIndex * 100) - (player.dynamicPriority || 0),
        reason: `Need (第${wishIndex + 1}希望)`,
        type: 'need'
      };
    } else {
      return {
        canReceive: false,
        score: 0,
        reason: 'Pass (希望なし)',
        type: 'pass'
      };
    }
  }

  /**
   * 素材の優先度計算
   */
  private calculateMaterialPriority(
    player: Player,
    position: Position,
    drop: Drop,
    allocations: Allocation[]
  ): PriorityResult {
    const materialStatus = this.getPlayerEquipmentStatus(position, drop.slot, allocations);

    // 断章交換素材の特別処理
    if (materialStatus === '断章交換' || materialStatus === '断章交換・箱取得済') {
      return {
        canReceive: false,
        score: 0,
        reason: 'Pass (断章交換)',
        type: 'pass'
      };
    }

    if (materialStatus === '未取得') {
      return {
        canReceive: true,
        score: this.getPositionPriority(position) - (player.dynamicPriority || 0),
        reason: 'Need (素材)',
        type: 'need'
      };
    } else {
      return {
        canReceive: false,
        score: 0,
        reason: 'Pass (取得済み)',
        type: 'pass'
      };
    }
  }

  /**
   * プレイヤーの装備状況を取得
   */
  private getPlayerEquipmentStatus(
    position: Position,
    slot: string,
    allocations: Allocation[]
  ): string {
    const allocation = allocations.find(
      alloc => alloc.position === position && alloc.slot === slot
    );

    if (allocation && allocation.status) {
      return allocation.status;
    }

    // 既存のデータでstatusがない場合は「取得済み」とみなす
    if (allocation) {
      return '取得済み';
    }

    return '未取得';
  }

  /**
   * 同じスロットで優先ポリシーの未取得者がいるかチェック
   */
  private hasUnacquiredRaidPlayers(
    slot: string,
    excludePosition: Position,
    allocations: Allocation[]
  ): boolean {
    const state = this.stateManager.getState();
    const currentRaidTier = state.currentRaidTier;
    if (!currentRaidTier) return false;

    const players = state.appData.players[currentRaidTier.id] || {};

    for (const [position, player] of Object.entries(players) as [Position, Player][]) {
      if (position === excludePosition) continue;

      const policy = player.policies[slot as keyof typeof player.policies];
      const status = this.getPlayerEquipmentStatus(position, slot, allocations);

      if (policy === '優先' && status === '未取得') {
        return true;
      }
    }

    return false;
  }

  /**
   * 武器箱で優先ポリシーの未取得者がいるかチェック
   */
  private hasUnacquiredWeaponBoxPlayers(
    excludePosition: Position,
    allocations: Allocation[]
  ): boolean {
    const state = this.stateManager.getState();
    const currentRaidTier = state.currentRaidTier;
    if (!currentRaidTier) return false;

    const players = state.appData.players[currentRaidTier.id] || {};

    for (const [position, player] of Object.entries(players) as [Position, Player][]) {
      if (position === excludePosition) continue;

      const weaponPolicy = player.policies['武器'];
      const weaponBoxStatus = this.getPlayerEquipmentStatus(position, '武器箱', allocations);

      if (weaponPolicy === '優先' && weaponBoxStatus === '未取得') {
        return true;
      }
    }

    return false;
  }

  /**
   * ポジション優先度を取得
   */
  private getPositionPriority(position: Position): number {
    const priorities: Record<Position, number> = {
      'MT': 8,
      'ST': 7,
      'D1': 6,
      'D2': 5,
      'D3': 4,
      'D4': 3,
      'H1': 2,
      'H2': 1
    };

    return priorities[position] || 0;
  }
}
