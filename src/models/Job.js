class Job {
    constructor(name, role, priority = 0) {
        this.name = name;
        this.role = role;
        this.priority = priority;
    }
}

const JOBS = {
    // Tank
    PALADIN: new Job('Ê¤È', 'Tank', 1),
    WARRIOR: new Job('&ë', 'Tank', 1),
    DARK_KNIGHT: new Job('—Òë', 'Tank', 1),
    GUNBREAKER: new Job('¬óÖì¤«ü', 'Tank', 1),
    
    // Healer
    WHITE_MAGE: new Job('}TSë', 'Healer', 2),
    SCHOLAR: new Job('f', 'Healer', 2),
    ASTROLOGIAN: new Job('`S+', 'Healer', 2),
    SAGE: new Job('â', 'Healer', 2),
    
    // Melee DPS
    MONK: new Job('âó¯', 'Melee', 3),
    DRAGOON: new Job('Üë', 'Melee', 3),
    NINJA: new Job('Í', 'Melee', 3),
    SAMURAI: new Job('', 'Melee', 3),
    REAPER: new Job('êüÑü', 'Melee', 3),
    VIPER: new Job('ô¡¤Ñü', 'Melee', 3),
    
    // Physical Ranged DPS
    BARD: new Job('Jiº', 'Ranged', 4),
    MACHINIST: new Job('_åë', 'Ranged', 4),
    DANCER: new Job('
ŠP', 'Ranged', 4),
    
    // Magical Ranged DPS
    BLACK_MAGE: new Job('ÒTSë', 'Caster', 5),
    SUMMONER: new Job('ìšë', 'Caster', 5),
    RED_MAGE: new Job('dTSë', 'Caster', 5),
    BLUE_MAGE: new Job('RTSë', 'Caster', 5),
    PICTOMANCER: new Job('Ô¯ÈÞóµü', 'Caster', 5)
};

const JOB_ROLES = {
    Tank: ['Ê¤È', '&ë', '—Òë', '¬óÖì¤«ü'],
    Healer: ['}TSë', 'f', '`S+', 'â'],
    Melee: ['âó¯', 'Üë', 'Í', '', 'êüÑü', 'ô¡¤Ñü'],
    Ranged: ['Jiº', '_åë', '
ŠP'],
    Caster: ['ÒTSë', 'ìšë', 'dTSë', 'RTSë', 'Ô¯ÈÞóµü']
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