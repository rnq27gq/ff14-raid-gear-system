// �������

class Player {
    constructor(name, characterName, position, job) {
        this.id = this.generateId();
        this.name = name;
        this.characterName = characterName;
        this.position = position; // MT, ST, H1, H2, D1, D2, D3, D4
        this.job = job;
        this.equipmentPolicy = {}; // �Mnř����� or ������	
        this.currentEquipment = {}; // �(ř
        this.weaponWishes = []; // 4d�����fh��
        this.createdAt = new Date();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ř�ݒ-�
    setEquipmentPolicy(slot, policy) {
        this.equipmentPolicy[slot] = policy; // '���' or '������'
    }

    // �(ř���
    updateCurrentEquipment(slot, itemLevel, source) {
        this.currentEquipment[slot] = {
            itemLevel: itemLevel,
            source: source, // '�', '�', '������'
            updatedAt: new Date()
        };
    }

    // fh���
    addWeaponWish(jobName, priority = 1, reason = '') {
        this.weaponWishes.push({
            jobName: jobName,
            priority: priority,
            reason: reason,
            addedAt: new Date()
        });
        // *H�k���
        this.weaponWishes.sort((a, b) => a.priority - b.priority);
    }

    // fh�Jd
    removeWeaponWish(jobName) {
        this.weaponWishes = this.weaponWishes.filter(wish => wish.jobName !== jobName);
    }

    // ř����
    getEquipmentCompletionRate() {
        const totalSlots = Object.keys(this.equipmentPolicy).length;
        const completedSlots = Object.keys(this.currentEquipment).filter(slot => {
            const current = this.currentEquipment[slot];
            const policy = this.equipmentPolicy[slot];
            
            if (policy === '���') {
                return current && (current.source === '�' || current.source === '�');
            } else if (policy === '������') {
                return current && current.source === '������';
            }
            return false;
        }).length;

        return totalSlots > 0 ? (completedSlots / totalSlots) * 100 : 0;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Player };
}