// Discord OAuth2設定
const DISCORD_CONFIG = {
    client_id: '1421136327843250286',
    redirect_uri: window.location.origin + window.location.pathname,
    scope: 'identify',
    response_type: 'code'
};

// GitHub Actionsによってデプロイ時に認証情報が注入されます
window.SUPABASE_CONFIG = {
    SUPABASE_URL: '{{SUPABASE_URL}}',
    SUPABASE_ANON_KEY: '{{SUPABASE_ANON_KEY}}'
};

// 定数定義
const POSITIONS = ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];

const EQUIPMENT_SLOTS = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];

const MATERIAL_SLOTS = ['武器石', '硬化薬', '強化薬', '強化繊維'];

const JOB_LIST = [
    'ナイト', 'ガンブレイカー', '戦士', '暗黒騎士',
    '竜騎士', 'モンク', '忍者', '侍', 'リーパー', 'ヴァイパー',
    '吟遊詩人', '機工士', '踊り子',
    '黒魔道士', '召喚士', '赤魔道士', 'ピクトマンサー',
    '白魔道士', '学者', '占星術師', '賢者'
];

const WEAPON_TYPES = [
    'ナイト武器', '戦士武器', '暗黒騎士武器', 'ガンブレイカー武器',
    '竜騎士武器', 'モンク武器', '忍者武器', '侍武器', 'リーパー武器', 'ヴァイパー武器',
    '吟遊詩人武器', '機工士武器', '踊り子武器',
    '黒魔道士武器', '召喚士武器', '赤魔道士武器', 'ピクトマンサー武器',
    '白魔道士武器', '学者武器', '占星術師武器', '賢者武器'
];

// 層別ドロップテーブル
const LAYER_DROPS = {
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

// グローバルスコープに公開
window.DISCORD_CONFIG = DISCORD_CONFIG;
window.POSITIONS = POSITIONS;
window.EQUIPMENT_SLOTS = EQUIPMENT_SLOTS;
window.MATERIAL_SLOTS = MATERIAL_SLOTS;
window.JOB_LIST = JOB_LIST;
window.WEAPON_TYPES = WEAPON_TYPES;
window.LAYER_DROPS = LAYER_DROPS;