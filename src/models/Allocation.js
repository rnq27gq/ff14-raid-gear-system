// Å™M2âÇë

class Allocation {
    constructor(raidTierId, layer, equipment, recipient, source = 'ö') {
        this.id = this.generateId();
        this.raidTierId = raidTierId;
        this.layer = layer; // 1, 2, 3, 4
        this.equipment = equipment; // Å™
        this.recipient = recipient; // ×Öºn×ì¤äüID
        this.source = source; // 'ö', 'ôÉíÃ×'
        this.allocatedAt = new Date();
        this.weekNumber = this.getCurrentWeekNumber();
        this.clearDate = new Date(); // Ÿ›n¯ê¢åB
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // þ(n1j÷’—kÜ17:00ú–	
    getCurrentWeekNumber() {
        const now = new Date();
        const baseDate = new Date('2023-01-03T17:00:00+09:00'); // ú–åkÜ17:00	
        const diffTime = now.getTime() - baseDate.getTime();
        const diffWeeks = Math.floor(diffTime / (1000 * 3600 * 24 * 7));
        return diffWeeks;
    }

    // M1’-š
    setReason(reason) {
        this.reason = reason;
    }
}

// fhÖ—etn(¯é¹
class WeaponAllocation extends Allocation {
    constructor(raidTierId, layer, weaponName, jobName, recipient, source = 'ö', isDirectDrop = false) {
        super(raidTierId, layer, weaponName, recipient, source);
        this.jobName = jobName; // þa¸çÖ
        this.isDirectDrop = isDirectDrop; // ôÉíÃ×KiFK
        this.type = 'weapon';
    }

    // ôÉíÃ×fhnM*HM’—
    static calculateDirectDropPriority(players, droppedWeaponJob) {
        const priorityList = [];

        players.forEach(player => {
            // 1. {2¸çÖkrS & fh*Ö—
            if (player.job === droppedWeaponJob && !this.hasWeapon(player)) {
                priorityList.push({
                    player: player,
                    priority: 1,
                    reason: '{2¸çÖrSûfh*Ö—'
                });
            }
            // 2. {2¸çÖå & {2
            else if (player.job !== droppedWeaponJob && 
                     player.weaponWishes.some(wish => wish.jobName === droppedWeaponJob)) {
                priorityList.push({
                    player: player,
                    priority: 2,
                    reason: '{2'
                });
            }
        });

        return priorityList.sort((a, b) => a.priority - b.priority);
    }

    // ×ì¤äüLfh’cfD‹KÁ§Ã¯
    static hasWeapon(player) {
        return player.currentEquipment['fh'] && 
               (player.currentEquipment['fh'].source === 'ö' || 
                player.currentEquipment['fh'].source === 'ôÉíÃ×');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Allocation, WeaponAllocation };
}