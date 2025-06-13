// řM2���

class Allocation {
    constructor(raidTierId, layer, equipment, recipient, source = '�') {
        this.id = this.generateId();
        this.raidTierId = raidTierId;
        this.layer = layer; // 1, 2, 3, 4
        this.equipment = equipment; // ř
        this.recipient = recipient; // �ֺn����ID
        this.source = source; // '�', '�����'
        this.allocatedAt = new Date();
        this.weekNumber = this.getCurrentWeekNumber();
        this.clearDate = new Date(); // ��n���B
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // �(n1j���k�17:00��	
    getCurrentWeekNumber() {
        const now = new Date();
        const baseDate = new Date('2023-01-03T17:00:00+09:00'); // ���k�17:00	
        const diffTime = now.getTime() - baseDate.getTime();
        const diffWeeks = Math.floor(diffTime / (1000 * 3600 * 24 * 7));
        return diffWeeks;
    }

    // M1�-�
    setReason(reason) {
        this.reason = reason;
    }
}

// fh֗etn(��
class WeaponAllocation extends Allocation {
    constructor(raidTierId, layer, weaponName, jobName, recipient, source = '�', isDirectDrop = false) {
        super(raidTierId, layer, weaponName, recipient, source);
        this.jobName = jobName; // �a���
        this.isDirectDrop = isDirectDrop; // �����KiFK
        this.type = 'weapon';
    }

    // �����fhnM*HM��
    static calculateDirectDropPriority(players, droppedWeaponJob) {
        const priorityList = [];

        players.forEach(player => {
            // 1. {2���krS & fh*֗
            if (player.job === droppedWeaponJob && !this.hasWeapon(player)) {
                priorityList.push({
                    player: player,
                    priority: 1,
                    reason: '{2���rS�fh*֗'
                });
            }
            // 2. {2���� & {2
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

    // ����Lfh�cfD�K��ï
    static hasWeapon(player) {
        return player.currentEquipment['fh'] && 
               (player.currentEquipment['fh'].source === '�' || 
                player.currentEquipment['fh'].source === '�����');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Allocation, WeaponAllocation };
}