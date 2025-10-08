import type { Position, AllSlot, Layer, AllocationStatus } from './common';
import type { Player } from './player';

// 分配記録
export interface Allocation {
  position: Position;
  slot: AllSlot;
  layer: Layer;
  week: number;
  timestamp: string;
  status?: AllocationStatus;
  weapon?: string;  // 直ドロップ武器の場合
}

// ドロップアイテム
export interface Drop {
  name: string;
  slot: AllSlot;
  type: 'equipment' | 'material' | 'weapon_box' | 'direct_weapon';
  itemLevel?: string;
  weapon?: string | null;
}

// 分配候補者
export interface AllocationCandidate {
  position: Position;
  player: Player;
  priority: number;
  reason: string;
  type: 'need' | 'greed' | 'pass';
  canReceive: boolean;
}

// 分配結果
export interface AllocationResult {
  drop: Drop;
  recommended: AllocationCandidate | null;
  candidates: AllocationCandidate[];
  isMultipleRecommended: boolean;
  multipleRecommended?: AllocationCandidate[];
}
