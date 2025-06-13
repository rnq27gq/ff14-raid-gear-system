class Job {
    constructor(name, role, priority = 0) {
        this.name = name;
        this.role = role;
        this.priority = priority;
    }
}

const JOBS = {
    // Tank
    PALADIN: new Job('ʤ�', 'Tank', 1),
    WARRIOR: new Job('&�', 'Tank', 1),
    DARK_KNIGHT: new Job('���', 'Tank', 1),
    GUNBREAKER: new Job('���줫�', 'Tank', 1),
    
    // Healer
    WHITE_MAGE: new Job('}TS�', 'Healer', 2),
    SCHOLAR: new Job('f', 'Healer', 2),
    ASTROLOGIAN: new Job('`S+', 'Healer', 2),
    SAGE: new Job('�', 'Healer', 2),
    
    // Melee DPS
    MONK: new Job('��', 'Melee', 3),
    DRAGOON: new Job('��', 'Melee', 3),
    NINJA: new Job('�', 'Melee', 3),
    SAMURAI: new Job('�', 'Melee', 3),
    REAPER: new Job('����', 'Melee', 3),
    VIPER: new Job('�����', 'Melee', 3),
    
    // Physical Ranged DPS
    BARD: new Job('Ji�', 'Ranged', 4),
    MACHINIST: new Job('_��', 'Ranged', 4),
    DANCER: new Job('
�P', 'Ranged', 4),
    
    // Magical Ranged DPS
    BLACK_MAGE: new Job('�TS�', 'Caster', 5),
    SUMMONER: new Job('��', 'Caster', 5),
    RED_MAGE: new Job('dTS�', 'Caster', 5),
    BLUE_MAGE: new Job('RTS�', 'Caster', 5),
    PICTOMANCER: new Job('ԯ����', 'Caster', 5)
};

const JOB_ROLES = {
    Tank: ['ʤ�', '&�', '���', '���줫�'],
    Healer: ['}TS�', 'f', '`S+', '�'],
    Melee: ['��', '��', '�', '�', '����', '�����'],
    Ranged: ['Ji�', '_��', '
�P'],
    Caster: ['�TS�', '��', 'dTS�', 'RTS�', 'ԯ����']
};

function getJobByName(name) {
    return Object.values(JOBS).find(job => job.name === name);
}

function getJobsByRole(role) {
    return Object.values(JOBS).filter(job => job.role === role);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Job, JOBS, JOB_ROLES, getJobByName, getJobsByRole };
}