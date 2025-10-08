import type { Position, EquipmentSlot, Policy, Job } from './common';

// 装備ポリシー
export interface EquipmentPolicy {
  武器: Policy;
  頭: Policy;
  胴: Policy;
  手: Policy;
  脚: Policy;
  足: Policy;
  耳: Policy;
  首: Policy;
  腕: Policy;
  指: Policy;
}

// プレイヤー情報
export interface Player {
  name: string;
  job: Job;
  position: Position;
  dynamicPriority: number;
  weaponWish1?: string;
  weaponWish2?: string;
  policies: EquipmentPolicy;
}

// ポジション別プレイヤーマップ
export type PlayerMap = {
  [key: string]: Player | undefined;
} & Partial<Record<Position, Player>>;
