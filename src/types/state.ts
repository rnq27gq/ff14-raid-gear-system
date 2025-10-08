import type { PlayerMap } from './player';
import type { Allocation } from './allocation';

// レイドティア
export interface RaidTier {
  id: string;
  name: string;
  createdAt: string;
}

// アプリケーションデータ
export interface AppData {
  raidTiers: Record<string, RaidTier>;
  players: PlayerMap;
  allocations: Record<string, Allocation>;
  settings: Record<string, unknown>;
  prioritySettings: Record<string, string[]>;
}

// アプリケーション状態
export interface AppState {
  isAuthenticated: boolean;
  currentTeamId: string | null;
  isInitializing: boolean;
  isInitialized: boolean;
  selectedDirectWeapon: string;
  currentRaidTier: RaidTier | null;
  appData: AppData;
}

// 状態リスナー
export type StateListener = (state: Readonly<AppState>) => void;
