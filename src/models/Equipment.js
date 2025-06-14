import { JOBS, LAYER_DROPS, EQUIPMENT_SLOTS } from '../utils/constants.js';

export class Equipment {
    constructor(name, slot, itemLevel, compatibleJobs, source = 'savage', layer = 1) {
        this.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        this.name = name;
        this.slot = slot;
        this.itemLevel = itemLevel;
        this.compatibleJobs = compatibleJobs;
        this.source = source; // 'savage' or 'tomestone'
        this.layer = layer;
        this.createdAt = new Date().toISOString();
    }

    /**
     * ����LSnř�(gM�K��ï
     * @param {Object} player - �����ָ���
     * @returns {boolean}
     */
    canPlayerUse(player) {
        return this.compatibleJobs.includes(player.job);
    }

    /**
     * SnřL����khcf��װ���K��ï
     * @param {Object} player - �����ָ���
     * @returns {boolean}
     */
    isUpgradeFor(player) {
        const currentEquipment = player.currentEquipment[this.slot];
        
        // �(řLjD4o��װ���
        if (!currentEquipment) {
            return true;
        }

        // ��������
        return this.itemLevel > currentEquipment.itemLevel;
    }

    /**
     * ����nNeed����
     * @param {Object} player - �����ָ���
     * @returns {number} - Need$�D{iŁ'L�D	
     */
    calculateNeedLevel(player) {
        if (!this.canPlayerUse(player)) {
            return 0;
        }

        const currentEquipment = player.currentEquipment[this.slot];
        
        if (!currentEquipment) {
            // �(řLjD4o 'Need
            return this.itemLevel;
        }

        // ��װ���E��
        const upgradeValue = this.itemLevel - currentEquipment.itemLevel;
        return Math.max(0, upgradeValue);
    }

    /**
     * řn��
     * @returns {string}
     */
    getDescription() {
        return `${this.name} (${this.slot}) - IL${this.itemLevel} - ${this.source} - ${this.layer}d`;
    }

    /**
     * ř���� JSON �ָ���k	�
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            slot: this.slot,
            itemLevel: this.itemLevel,
            compatibleJobs: this.compatibleJobs,
            source: this.source,
            layer: this.layer,
            createdAt: this.createdAt
        };
    }

    /**
     * JSON �ָ���K� Equipment ���\
     * @param {Object} data - JSON ���
     * @returns {Equipment}
     */
    static fromJSON(data) {
        const equipment = new Equipment(
            data.name,
            data.slot,
            data.itemLevel,
            data.compatibleJobs,
            data.source,
            data.layer
        );
        equipment.id = data.id;
        equipment.createdAt = data.createdAt;
        return equipment;
    }
}

/**
 * dn����ř�����Ȓ��
 */
export class EquipmentTemplates {
    /**
     * dj�k�eDf����řn�����Ȓ֗
     * @param {number} layer - dj� (1-4)
     * @returns {Array} - ř��������
     */
    static getLayerDropTemplates(layer) {
        const templates = {
            1: [
                { slot: '-', itemLevel: 730, allJobs: true },
                { slot: 'K', itemLevel: 730, allJobs: true },
                { slot: '�', itemLevel: 730, allJobs: true },
                { slot: '3', itemLevel: 730, allJobs: true }
            ],
            2: [
                { slot: '�', itemLevel: 730, allJobs: true },
                { slot: '', itemLevel: 730, allJobs: true },
                { slot: '�', itemLevel: 730, allJobs: true },
                { slot: 'U', itemLevel: 730, allJobs: true },
                { slot: '', itemLevel: 730, allJobs: true }
            ],
            3: [
                { slot: 'fh', itemLevel: 735, byRole: true }
            ],
            4: [
                { slot: 'fh', itemLevel: 735, byJob: true },
                { slot: '�', itemLevel: 730, allJobs: true },
                { slot: '', itemLevel: 730, allJobs: true }
            ]
        };

        return templates[layer] || [];
    }

    /**
     * ř������K���n Equipment �ָ��Ȓ
     * @param {Object} template - ř������
     * @param {number} layer - dj�
     * @returns {Array} - Equipment �ָ���n��
     */
    static createEquipmentFromTemplate(template, layer) {
        const equipmentList = [];
        
        if (template.allJobs) {
            // h���q(ř
            const allJobNames = Object.values(JOBS).map(job => job.name);
            const equipment = new Equipment(
                `${layer}d${template.slot}`,
                template.slot,
                template.itemLevel,
                allJobNames,
                'savage',
                layer
            );
            equipmentList.push(equipment);
        } else if (template.byRole) {
            // ���%ř
            const roleGroups = {
                'Tank': Object.values(JOBS).filter(job => job.role === 'Tank').map(job => job.name),
                'Healer': Object.values(JOBS).filter(job => job.role === 'Healer').map(job => job.name),
                'DPS': Object.values(JOBS).filter(job => job.role === 'DPS').map(job => job.name)
            };

            Object.entries(roleGroups).forEach(([role, jobs]) => {
                const equipment = new Equipment(
                    `${layer}d${template.slot}(${role})`,
                    template.slot,
                    template.itemLevel,
                    jobs,
                    'savage',
                    layer
                );
                equipmentList.push(equipment);
            });
        } else if (template.byJob) {
            // ���%ř;kfh	
            Object.values(JOBS).forEach(job => {
                const equipment = new Equipment(
                    `${layer}d${template.slot}(${job.name})`,
                    template.slot,
                    template.itemLevel,
                    [job.name],
                    'savage',
                    layer
                );
                equipmentList.push(equipment);
            });
        }

        return equipmentList;
    }

    /**
     * �W_dnh����ř�
     * @param {number} layer - dj�
     * @returns {Array} - Equipment �ָ���n��
     */
    static generateLayerDrops(layer) {
        const templates = this.getLayerDropTemplates(layer);
        const allEquipment = [];

        templates.forEach(template => {
            const equipment = this.createEquipmentFromTemplate(template, layer);
            allEquipment.push(...equipment);
        });

        return allEquipment;
    }

    /**
     * 4dfh����K��U�_���nfhn�֗
     * @param {Array} weaponWishes - fh�� [{jobName, priority}]
     * @returns {Array} - U�_���nfh��
     */
    static getRequestedWeapons(weaponWishes) {
        const layer4Weapons = this.generateLayerDrops(4)
            .filter(equipment => equipment.slot === 'fh');
        
        const requestedJobNames = weaponWishes.map(wish => wish.jobName);
        
        return layer4Weapons.filter(weapon => 
            weapon.compatibleJobs.some(job => requestedJobNames.includes(job))
        );
    }
}