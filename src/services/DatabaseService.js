// ��������ӹ��������(	

class DatabaseService {
    constructor() {
        this.storageKey = 'ff14_gear_allocation_data';
        this.initializeStorage();
    }

    // �����n
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                raidTiers: [],
                activeRaidTierId: null,
                players: {},
                allocations: {},
                version: '1.0.0'
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialData));
        }
    }

    // ����֗
    getData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
    }

    // �����X
    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // ��ƣ��#
    createRaidTier(name, description = '') {
        const data = this.getData();
        const raidTier = {
            id: this.generateId(),
            name: name,
            description: description,
            createdAt: new Date().toISOString(),
            isActive: false
        };
        
        data.raidTiers.push(raidTier);
        this.saveData(data);
        return raidTier;
    }

    getRaidTiers() {
        const data = this.getData();
        return data.raidTiers || [];
    }

    getActiveRaidTier() {
        const data = this.getData();
        return data.raidTiers.find(tier => tier.id === data.activeRaidTierId) || null;
    }

    setActiveRaidTier(raidTierId) {
        const data = this.getData();
        // hfn��ƣ��^��ƣ�k
        data.raidTiers.forEach(tier => tier.isActive = false);
        // �U�_��ƣ����ƣ�k
        const targetTier = data.raidTiers.find(tier => tier.id === raidTierId);
        if (targetTier) {
            targetTier.isActive = true;
            data.activeRaidTierId = raidTierId;
            this.saveData(data);
            return true;
        }
        return false;
    }

    // �����#
    savePlayersForTier(raidTierId, players) {
        const data = this.getData();
        if (!data.players[raidTierId]) {
            data.players[raidTierId] = {};
        }
        data.players[raidTierId] = players;
        this.saveData(data);
    }

    getPlayersForTier(raidTierId) {
        const data = this.getData();
        return data.players[raidTierId] || {};
    }

    // Met�#
    saveAllocation(allocation) {
        const data = this.getData();
        if (!data.allocations[allocation.raidTierId]) {
            data.allocations[allocation.raidTierId] = [];
        }
        data.allocations[allocation.raidTierId].push(allocation);
        this.saveData(data);
    }

    getAllocationsForTier(raidTierId) {
        const data = this.getData();
        return data.allocations[raidTierId] || [];
    }

    // ��ƣ�ƣ
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ���n������
    exportData() {
        return this.getData();
    }

    // ���n�����
    importData(importedData) {
        this.saveData(importedData);
    }

    // ���n���
    resetData() {
        localStorage.removeItem(this.storageKey);
        this.initializeStorage();
    }
}

// ブラウザ環境ではグローバルオブジェクトとして公開
if (typeof window !== 'undefined') {
    window.DatabaseService = DatabaseService;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DatabaseService };
}