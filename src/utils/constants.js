// FF14ˆ≈ôM∑π∆‡ - öpö©

// ›∏∑ÁÛö©8∫˙ö	
export const POSITIONS = {
    MT: 'MT',  // Main Tank
    ST: 'ST',  // Sub Tank
    H1: 'H1',  // Healer 1 (Pure Healer)
    H2: 'H2',  // Healer 2 (Barrier Healer)
    D1: 'D1',  // DPS 1 (Melee)
    D2: 'D2',  // DPS 2 (Melee)
    D3: 'D3',  // DPS 3 (Range/Caster)
    D4: 'D4'   // DPS 4 (Range/Caster)
};

// ∏Á÷ö©
export const JOBS = {
    // Tank
    PALADIN: { name: ' §»', role: 'Tank', positions: ['MT', 'ST'] },
    WARRIOR: { name: '&Î', role: 'Tank', positions: ['MT', 'ST'] },
    DARK_KNIGHT: { name: 'ó“Î', role: 'Tank', positions: ['MT', 'ST'] },
    GUNBREAKER: { name: '¨Û÷Ï§´¸', role: 'Tank', positions: ['MT', 'ST'] },
    
    // Healer Pure
    WHITE_MAGE: { name: '}TSÎ', role: 'Healer', subRole: 'Pure', positions: ['H1'] },
    ASTROLOGIAN: { name: '`S+', role: 'Healer', subRole: 'Pure', positions: ['H1'] },
    
    // Healer Barrier
    SCHOLAR: { name: 'f', role: 'Healer', subRole: 'Barrier', positions: ['H2'] },
    SAGE: { name: '‚', role: 'Healer', subRole: 'Barrier', positions: ['H2'] },
    
    // DPS Melee
    MONK: { name: '‚ÛØ', role: 'DPS', subRole: 'Melee', positions: ['D1', 'D2'] },
    DRAGOON: { name: '‹Î', role: 'DPS', subRole: 'Melee', positions: ['D1', 'D2'] },
    NINJA: { name: 'Õ', role: 'DPS', subRole: 'Melee', positions: ['D1', 'D2'] },
    SAMURAI: { name: 'ç', role: 'DPS', subRole: 'Melee', positions: ['D1', 'D2'] },
    REAPER: { name: 'Í¸—¸', role: 'DPS', subRole: 'Melee', positions: ['D1', 'D2'] },
    VIPER: { name: 'Ù°§—¸', role: 'DPS', subRole: 'Melee', positions: ['D1', 'D2'] },
    
    // DPS Range
    BARD: { name: 'Ji∫', role: 'DPS', subRole: 'Range', positions: ['D3', 'D4'] },
    MACHINIST: { name: '_ÂÎ', role: 'DPS', subRole: 'Range', positions: ['D3', 'D4'] },
    DANCER: { name: '
äP', role: 'DPS', subRole: 'Range', positions: ['D3', 'D4'] },
    
    // DPS Caster
    BLACK_MAGE: { name: '“TSÎ', role: 'DPS', subRole: 'Caster', positions: ['D3', 'D4'] },
    SUMMONER: { name: 'ÏöÎ', role: 'DPS', subRole: 'Caster', positions: ['D3', 'D4'] },
    RED_MAGE: { name: 'dTSÎ', role: 'DPS', subRole: 'Caster', positions: ['D3', 'D4'] },
    PICTOMANCER: { name: '‘Ø»ﬁÛµ¸', role: 'DPS', subRole: 'Caster', positions: ['D3', 'D4'] }
};

// ≈ô*HMÅˆö©¯àä	
export const PRIORITY_ORDER = {
    1: 'DPS_Melee',   // D1, D2
    2: 'DPS_Other',   // D3, D4
    3: 'Tank',        // MT, ST
    4: 'Healer'       // H1, H2
};

// dn˙ö…Ì√◊≈ô
export const LAYER_DROPS = {
    1: ['3±', 'ñ±', 'U±', '±'],
    2: ['-±', 'K±', '≥±', 'fhÛ', 'l¨'],
    3: ['Ù±', '±', '7¨', '7J≠'],
    4: ['Ù±', 'fh±', 'ﬁ¶Û»', 'Ù…Ì√◊fh']
};

// ≈ôπÌ√»
export const EQUIPMENT_SLOTS = [
    'fh', '-', 'Ù', 'K', '', '≥', '3', 'ñ', 'U', ''
];

// ≈ôxûπ›
export const EQUIPMENT_POLICY = {
    SAVAGE: 'ˆ',
    TOMESTONE: '»¸‡π»¸Û'
};

// Need/Greed/Pass$ö
export const JUDGMENT = {
    NEED: 'Need',
    GREED: 'Greed',
    PASS: 'Pass'
};

// 1!Íª√»Bìk‹17:00 JST	
export const WEEKLY_RESET = {
    DAY: 2,  // k‹Â (0=Â‹)
    HOUR: 17
};