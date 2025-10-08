import type {
  Position,
  EquipmentSlot,
  MaterialSlot,
  Job,
  WeaponType
} from '../types/common';

import type {
  DiscordConfig,
  SupabaseConfig,
  LayerDrops
} from '../types/config';

// Discord OAuth2設定
export const DISCORD_CONFIG: DiscordConfig = {
  client_id: '1421136327843250286',
  redirect_uri: window.location.origin + window.location.pathname,
  scope: 'identify',
  response_type: 'code'
};

// Supabase設定（GitHub Actionsによってデプロイ時に認証情報が注入される）
export const SUPABASE_CONFIG: SupabaseConfig = {
  url: '{{SUPABASE_URL}}',
  anonKey: '{{SUPABASE_ANON_KEY}}'
};

// ポジション定数
export const POSITIONS: readonly Position[] = ['MT', 'ST', 'D1', 'D2', 'D3', 'D4', 'H1', 'H2'] as const;

// 装備スロット定数
export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'] as const;

// 素材スロット定数
export const MATERIAL_SLOTS: readonly MaterialSlot[] = ['武器石', '硬化薬', '強化薬', '強化繊維'] as const;

// ジョブリスト
export const JOB_LIST: readonly Job[] = [
  'ナイト', 'ガンブレイカー', '戦士', '暗黒騎士',
  '竜騎士', 'モンク', '忍者', '侍', 'リーパー', 'ヴァイパー',
  '吟遊詩人', '機工士', '踊り子',
  '黒魔道士', '召喚士', '赤魔道士', 'ピクトマンサー',
  '白魔道士', '学者', '占星術師', '賢者'
] as const;

// ジョブ（配列として利用可能）
export const JOBS = JOB_LIST;

// スロット（装備スロット）
export const SLOTS = EQUIPMENT_SLOTS;

// 武器タイプリスト
export const WEAPON_TYPES: readonly WeaponType[] = [
  'ナイト武器', '戦士武器', '暗黒騎士武器', 'ガンブレイカー武器',
  '竜騎士武器', 'モンク武器', '忍者武器', '侍武器', 'リーパー武器', 'ヴァイパー武器',
  '吟遊詩人武器', '機工士武器', '踊り子武器',
  '黒魔道士武器', '召喚士武器', '赤魔道士武器', 'ピクトマンサー武器',
  '白魔道士武器', '学者武器', '占星術師武器', '賢者武器'
] as const;

// 層別ドロップテーブル
export const LAYER_DROPS: LayerDrops = {
  1: [
    { name: '耳装備', slot: '耳', type: 'equipment', itemLevel: '' },
    { name: '首装備', slot: '首', type: 'equipment', itemLevel: '' },
    { name: '腕装備', slot: '腕', type: 'equipment', itemLevel: '' },
    { name: '指装備', slot: '指', type: 'equipment', itemLevel: '' }
  ],
  2: [
    { name: '頭装備', slot: '頭', type: 'equipment', itemLevel: '' },
    { name: '手装備', slot: '手', type: 'equipment', itemLevel: '' },
    { name: '足装備', slot: '足', type: 'equipment', itemLevel: '' },
    { name: '武器石', slot: '武器石', type: 'material', itemLevel: '' },
    { name: '硬化薬', slot: '硬化薬', type: 'material', itemLevel: '' }
  ],
  3: [
    { name: '胴装備', slot: '胴', type: 'equipment', itemLevel: '' },
    { name: '脚装備', slot: '脚', type: 'equipment', itemLevel: '' },
    { name: '強化薬', slot: '強化薬', type: 'material', itemLevel: '' },
    { name: '強化繊維', slot: '強化繊維', type: 'material', itemLevel: '' }
  ],
  4: [
    { name: '胴装備', slot: '胴', type: 'equipment', itemLevel: '' },
    { name: '武器箱', slot: '武器箱', type: 'weapon_box', itemLevel: '' },
    { name: '直ドロップ武器', slot: '直ドロップ武器', type: 'direct_weapon', itemLevel: '', weapon: null }
  ]
};
