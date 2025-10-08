// 共通型定義

// Position型
export type Position = 'MT' | 'ST' | 'D1' | 'D2' | 'D3' | 'D4' | 'H1' | 'H2';

// Role型
export type Role = 'tank' | 'healer' | 'dps';

// EquipmentSlot型
export type EquipmentSlot = '武器' | '頭' | '胴' | '手' | '脚' | '足' | '耳' | '首' | '腕' | '指';

// MaterialSlot型
export type MaterialSlot = '武器石' | '硬化薬' | '強化薬' | '強化繊維';

// AllSlot型 (装備 + 素材 + その他)
export type AllSlot = EquipmentSlot | MaterialSlot | '武器箱' | '直ドロップ武器' | '第一希望武器';

// Policy型
export type Policy = '優先' | '通常' | '最後';

// AllocationStatus型
export type AllocationStatus = '取得済' | '断章交換' | '断章交換・箱取得済';

// Layer型
export type Layer = 1 | 2 | 3 | 4;

// Job型
export type Job =
  | 'ナイト' | 'ガンブレイカー' | '戦士' | '暗黒騎士'
  | '竜騎士' | 'モンク' | '忍者' | '侍' | 'リーパー' | 'ヴァイパー'
  | '吟遊詩人' | '機工士' | '踊り子'
  | '黒魔道士' | '召喚士' | '赤魔道士' | 'ピクトマンサー'
  | '白魔道士' | '学者' | '占星術師' | '賢者';

// WeaponType型
export type WeaponType =
  | 'ナイト武器' | '戦士武器' | '暗黒騎士武器' | 'ガンブレイカー武器'
  | '竜騎士武器' | 'モンク武器' | '忍者武器' | '侍武器' | 'リーパー武器' | 'ヴァイパー武器'
  | '吟遊詩人武器' | '機工士武器' | '踊り子武器'
  | '黒魔道士武器' | '召喚士武器' | '赤魔道士武器' | 'ピクトマンサー武器'
  | '白魔道士武器' | '学者武器' | '占星術師武器' | '賢者武器';
