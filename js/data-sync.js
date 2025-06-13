class DataSyncManager {
    constructor(githubAPI, authManager) {
        this.githubAPI = githubAPI;
        this.authManager = authManager;
        this.localData = {
            'raid-tiers.json': null,
            'players.json': null,
            'allocations.json': null,
            'settings.json': null
        };
        this.syncStatus = 'offline';
    }

    async initialize() {
        if (!this.authManager.isAuthenticated()) {
            throw new Error('認証が必要です');
        }

        try {
            await this.loadAllData();
            this.syncStatus = 'synced';
            this.updateSyncUI();
        } catch (error) {
            console.error('データ同期初期化エラー:', error);
            this.syncStatus = 'error';
            this.updateSyncUI();
            throw error;
        }
    }

    async loadAllData() {
        const files = Object.keys(this.localData);
        const promises = files.map(fileName => this.loadData(fileName));
        await Promise.all(promises);
    }

    async loadData(fileName) {
        try {
            const result = await this.githubAPI.getData(fileName);
            this.localData[fileName] = {
                content: result.content,
                sha: result.sha,
                lastUpdated: result.lastUpdated || new Date().toISOString()
            };
            
            // ローカルストレージにもキャッシュ
            localStorage.setItem(`cache_${fileName}`, JSON.stringify(this.localData[fileName]));
            
            return this.localData[fileName].content;
        } catch (error) {
            console.error(`データ読み込みエラー (${fileName}):`, error);
            
            // オフライン時はローカルキャッシュを使用
            const cached = localStorage.getItem(`cache_${fileName}`);
            if (cached) {
                this.localData[fileName] = JSON.parse(cached);
                return this.localData[fileName].content;
            }
            
            // デフォルトデータを返す
            return this.getDefaultData(fileName);
        }
    }

    async saveData(fileName, data, commitMessage = '데이터 업데이트') {
        if (!this.authManager.isAuthenticated()) {
            throw new Error('認証が必要です');
        }

        this.syncStatus = 'syncing';
        this.updateSyncUI();

        try {
            const currentData = this.localData[fileName];
            const sha = currentData ? currentData.sha : null;
            
            const result = await this.githubAPI.saveData(fileName, data, commitMessage, sha);
            
            this.localData[fileName] = {
                content: data,
                sha: result.sha,
                lastUpdated: new Date().toISOString()
            };
            
            // ローカルキャッシュも更新
            localStorage.setItem(`cache_${fileName}`, JSON.stringify(this.localData[fileName]));
            
            this.syncStatus = 'synced';
            this.updateSyncUI();
            
            return result;
        } catch (error) {
            console.error(`データ保存エラー (${fileName}):`, error);
            this.syncStatus = 'error';
            this.updateSyncUI();
            throw error;
        }
    }

    getData(fileName) {
        return this.localData[fileName] ? this.localData[fileName].content : this.getDefaultData(fileName);
    }

    getDefaultData(fileName) {
        const defaults = {
            'raid-tiers.json': {
                raidTiers: [],
                activeRaidTierId: null,
                lastUpdated: new Date().toISOString(),
                updatedBy: 'system'
            },
            'players.json': {
                players: {},
                lastUpdated: new Date().toISOString(),
                updatedBy: 'system'
            },
            'allocations.json': {
                allocations: {},
                lastUpdated: new Date().toISOString(),
                updatedBy: 'system'
            },
            'settings.json': {
                teamMembers: [],
                permissions: {},
                lastUpdated: new Date().toISOString(),
                updatedBy: 'system'
            }
        };
        return defaults[fileName] || {};
    }

    updateSyncUI() {
        const syncStatus = document.getElementById('sync-status');
        if (syncStatus) {
            const statusMap = {
                'offline': { text: 'オフライン', class: 'status-offline' },
                'syncing': { text: '同期中...', class: 'status-syncing' },
                'synced': { text: '同期済み', class: 'status-synced' },
                'error': { text: '同期エラー', class: 'status-error' }
            };
            
            const status = statusMap[this.syncStatus] || statusMap['offline'];
            syncStatus.textContent = status.text;
            syncStatus.className = `sync-status ${status.class}`;
        }
    }

    async syncAll() {
        if (!this.authManager.isAuthenticated()) {
            throw new Error('認証が必要です');
        }

        this.syncStatus = 'syncing';
        this.updateSyncUI();

        try {
            await this.loadAllData();
            this.syncStatus = 'synced';
            this.updateSyncUI();
        } catch (error) {
            this.syncStatus = 'error';
            this.updateSyncUI();
            throw error;
        }
    }

    getSyncStatus() {
        return this.syncStatus;
    }
}