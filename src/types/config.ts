import type { Layer } from './common';
import type { Drop } from './allocation';

// Discord OAuth2設定
export interface DiscordConfig {
  client_id: string;
  redirect_uri: string;
  scope: string;
  response_type: string;
}

// Supabase設定
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// 層別ドロップテーブル
export type LayerDrops = Record<Layer, Drop[]>;
