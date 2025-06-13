// レイドティアモデル

class RaidTier {
    constructor(name, description = '') {
        this.id = this.generateId();
        this.name = name;
        this.description = description;
        this.createdAt = new Date();
        this.isActive = false;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    activate() {
        this.isActive = true;
    }

    deactivate() {
        this.isActive = false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RaidTier };
}