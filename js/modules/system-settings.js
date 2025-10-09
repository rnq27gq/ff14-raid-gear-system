// システム設定・データエクスポート機能

function showSystemSettings() {
    try {
        if (!window.appData.currentTier) {
            showError('tierを選択してください');
            return;
        }

        const currentView = document.getElementById('currentView');
        currentView.innerHTML = `
            <div class="content-section">
                <h2>システム設定</h2>
                <div class="settings-container">
                    <div class="setting-group">
                        <h3>データ管理</h3>
                        <button onclick="exportAllData()" class="primary-button">全データエクスポート</button>
                        <p class="setting-description">現在のtierの全データをJSON形式でエクスポートします</p>
                    </div>
                    <div class="setting-group">
                        <h3>チーム情報</h3>
                        <p><strong>チームID:</strong> ${window.appData.teamId || '未設定'}</p>
                        <p><strong>現在のTier:</strong> ${window.currentRaidTier.name || '未設定'}</p>
                        <p><strong>登録プレイヤー数:</strong> ${window.appData.players?.[window.currentRaidTier.id]?.length || 0}名</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('システム設定表示エラー:', error);
        showError('システム設定の表示に失敗しました');
    }
}

function exportAllData() {
    try {
        if (!window.appData.currentTier) {
            showError('tierを選択してください');
            return;
        }

        const exportData = {
            teamId: window.appData.teamId,
            tier: window.currentRaidTier,
            players: window.appData.players[window.currentRaidTier.id] || [],
            allocations: window.appData.allocations[window.currentRaidTier.id] || [],
            prioritySettings: window.appData.prioritySettings || {},
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ff14_gear_allocation_${window.currentRaidTier.id}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        showSuccess('データをエクスポートしました');
    } catch (error) {
        console.error('データエクスポートエラー:', error);
        showError('データのエクスポートに失敗しました');
    }
}

export {
    showSystemSettings,
    exportAllData
};
