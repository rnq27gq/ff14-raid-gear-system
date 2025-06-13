// FF14�řM���� - �p��

// ݸ���8���	
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

// ��֚�
export const JOBS = {
    // Tank
    PALADIN: { name: 'ʤ�', role: 'Tank', positions: ['MT', 'ST'] },
    WARRIOR: { name: '&�', role: 'Tank', positions: ['MT', 'ST'] },
    DARK_KNIGHT: { name: '���', role: 'Tank', positions: ['MT', 'ST'] },
    GUNBREAKER: { name: '���줫�', role: 'Tank', positions: ['MT', 'ST'] },
    
    // Healer Pure
    WHITE_MAGE: { name: '}TS�', role: 'Healer', subRole: 'Pure', positions: ['H1'] },
    ASTROLOGIAN: { name: '`S+', role: 'Healer', subRole: 'Pure', positions: ['H1'] },
    
    // Healer Barrier
    SCHOLAR: { name: 'f', role: 'Healer', subRole: 'Barrier', positions: ['H2'] },
    SAGE: { name: '�', role: 'Healer', subRole: 'Barrier', positions: ['H2'] },
    
    // DPS Melee
    MONK: { name: '��', role: 'DPS', subRole: 'Melee', positions: ['D1', 'D2'] },
    DRAGOON: { name: '��', role: 'DPS', subRole: 'Melee', positions: ['D1', 'D2'] },
    NINJA: { name: '�', role: 'DPS', subRole: 'Melee', positions: ['D1', 'D2'] },
    SAMURAI: { name: '�', role: 'DPS', subRole: 'Melee', positions: ['D1', 'D2'] },
    REAPER: { name: '����', role: 'DPS', subRole: 'Melee', positions: ['D1', 'D2'] },
    VIPER: { name: '�����', role: 'DPS', subRole: 'Melee', positions: ['D1', 'D2'] },
    
    // DPS Range
    BARD: { name: 'Ji�', role: 'DPS', subRole: 'Range', positions: ['D3', 'D4'] },
    MACHINIST: { name: '_��', role: 'DPS', subRole: 'Range', positions: ['D3', 'D4'] },
    DANCER: { name: '
�P', role: 'DPS', subRole: 'Range', positions: ['D3', 'D4'] },
    
    // DPS Caster
    BLACK_MAGE: { name: '�TS�', role: 'DPS', subRole: 'Caster', positions: ['D3', 'D4'] },
    SUMMONER: { name: '��', role: 'DPS', subRole: 'Caster', positions: ['D3', 'D4'] },
    RED_MAGE: { name: 'dTS�', role: 'DPS', subRole: 'Caster', positions: ['D3', 'D4'] },
    PICTOMANCER: { name: 'ԯ����', role: 'DPS', subRole: 'Caster', positions: ['D3', 'D4'] }
};

// ř*HM�������	
export const PRIORITY_ORDER = {
    1: 'DPS_Melee',   // D1, D2
    2: 'DPS_Other',   // D3, D4
    3: 'Tank',        // MT, ST
    4: 'Healer'       // H1, H2
};

// dn������ř
export const LAYER_DROPS = {
    1: ['3�', '��', 'U�', '�'],
    2: ['-�', 'K�', '��', 'fh�', 'l�'],
    3: ['��', '�', '7�', '7J�'],
    4: ['��', 'fh�', 'ަ��', '�����fh']
};

// ř����
export const EQUIPMENT_SLOTS = [
    'fh', '-', '�', 'K', '', '�', '3', '�', 'U', ''
];

// řx���
export const EQUIPMENT_POLICY = {
    SAVAGE: '�',
    TOMESTONE: '������'
};

// Need/Greed/Pass$�
export const JUDGMENT = {
    NEED: 'Need',
    GREED: 'Greed',
    PASS: 'Pass'
};

// 1!���B�k�17:00 JST	
export const WEEKLY_RESET = {
    DAY: 2,  // k�� (0=��)
    HOUR: 17
};