// ×ì¤äüâÇë

class Player {
    constructor(name, characterName, position, job) {
        this.id = this.generateId();
        this.name = name;
        this.characterName = characterName;
        this.position = position; // MT, ST, H1, H2, D1, D2, D3, D4
        this.job = job;
        this.equipmentPolicy = {}; // èMnÅ™¹Ý°ûö or Èüà¹Èüó	
        this.currentEquipment = {}; // þ(Å™
        this.weaponWishes = []; // 4dôÉíÃ×fhê¹È
        this.createdAt = new Date();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Å™¹Ý’-š
    setEquipmentPolicy(slot, policy) {
        this.equipmentPolicy[slot] = policy; // '°ûö' or 'Èüà¹Èüó'
    }

    // þ(Å™’ô°
    updateCurrentEquipment(slot, itemLevel, source) {
        this.currentEquipment[slot] = {
            itemLevel: itemLevel,
            source: source, // '°', 'ö', 'Èüà¹Èüó'
            updatedAt: new Date()
        };
    }

    // fh’ý 
    addWeaponWish(jobName, priority = 1, reason = '') {
        this.weaponWishes.push({
            jobName: jobName,
            priority: priority,
            reason: reason,
            addedAt: new Date()
        });
        // *H¦k½üÈ
        this.weaponWishes.sort((a, b) => a.priority - b.priority);
    }

    // fh’Jd
    removeWeaponWish(jobName) {
        this.weaponWishes = this.weaponWishes.filter(wish => wish.jobName !== jobName);
    }

    // Å™Œ¦’—
    getEquipmentCompletionRate() {
        const totalSlots = Object.keys(this.equipmentPolicy).length;
        const completedSlots = Object.keys(this.currentEquipment).filter(slot => {
            const current = this.currentEquipment[slot];
            const policy = this.equipmentPolicy[slot];
            
            if (policy === '°ûö') {
                return current && (current.source === 'ö' || current.source === '°');
            } else if (policy === 'Èüà¹Èüó') {
                return current && current.source === 'Èüà¹Èüó';
            }
            return false;
        }).length;

        return totalSlots > 0 ? (completedSlots / totalSlots) * 100 : 0;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Player };
}