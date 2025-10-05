// 統計・履歴機能

/**
 * 統計画面を表示
 */
function showStatistics() {
    try {
        const content = document.getElementById('content');
        if (!content) {
            console.error('Content element not found');
            showError('画面要素が見つかりません');
            return;
        }

        // グローバルスコープから参照
        const appData = window.appData;
        const currentRaidTier = window.currentRaidTier;

        if (!appData || !currentRaidTier) {
            showError('アプリケーションデータが初期化されていません');
            return;
        }

        const players = appData.players[currentRaidTier.id] || {};
        const allocations = appData.allocations[currentRaidTier.id] || [];

        if (Object.keys(players).length === 0) {
            showError('プレイヤー情報が設定されていません。');
            return;
        }

        // 統計データ計算
        const stats = calculateStatistics(players, allocations);

        content.innerHTML = `
            <div class="navigation-top-left">
                <button class="nav-button" onclick="showTierDashboard()">レイドダッシュボードに戻る</button>
            </div>

            <h1>統計情報</h1>
            <h2>${currentRaidTier.name}</h2>

            <div class="section">
                <h3>プレイヤー別取得状況
                    <button class="edit-button" onclick="showStatisticsEditMode()" style="margin-left: 20px;">編集開始</button>
                </h3>
                ${generatePlayerStatistics(players, allocations)}
            </div>
        `;
    } catch (error) {
        console.error('統計表示エラー:', error);
        showError('統計情報の表示に失敗しました');
    }
}

/**
 * プレイヤー別統計情報生成
 */
function generatePlayerStatistics(players, allocations) {
    try {
        // ポジション順序を固定化 (D1→D2→D3→D4→MT→ST→H1→H2)
        const positions = ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];

        // 装備部位順序を固定化 (武器箱→第一希望武器→頭→胴→手→脚→足→耳→首→腕→指)
        const equipmentSlots = ['武器箱', '第一希望武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];
        const materialSlots = ['武器石', '硬化薬', '強化薬', '強化繊維'];

        let html = '<div class="player-stats-table">';

        // ヘッダー
        html += `
            <div class="stats-header">
                <div class="player-name-col">プレイヤー</div>
                ${equipmentSlots.map(slot => `<div class="slot-col">${slot}</div>`).join('')}
                ${materialSlots.map(slot => `<div class="slot-col">${slot}</div>`).join('')}
            </div>
        `;

        // 各プレイヤーの行を生成
        positions.forEach(position => {
            const player = players[position];
            if (!player) return;

            html += `
                <div class="stats-row">
                    <div class="player-name-col">
                        <span class="player-name">${player.name}</span>
                        <span class="position-tag ${getPositionRoleClass(position)}">${position}</span>
                    </div>
            `;

            // 装備スロット
            equipmentSlots.forEach(slot => {
                const allocation = allocations.find(a => a.position === position && a.slot === slot);
                html += `<div class="slot-col">${allocation ? '●' : ''}</div>`;
            });

            // 素材スロット
            materialSlots.forEach(slot => {
                const allocationCount = allocations.filter(a => a.position === position && a.slot === slot).length;
                html += `<div class="slot-col">${allocationCount > 0 ? allocationCount : ''}</div>`;
            });

            html += '</div>';
        });

        html += '</div>';
        return html;
    } catch (error) {
        console.error('プレイヤー統計生成エラー:', error);
        return '<div class="error">統計情報の生成に失敗しました</div>';
    }
}

/**
 * 統計データを計算
 */
function calculateStatistics(players, allocations) {
    try {
        const playerStats = {};
        const slotStats = {};
        const weekStats = {};

        // プレイヤー統計初期化
        Object.entries(players).forEach(([position, player]) => {
            playerStats[position] = {
                name: player.name,
                equipmentCount: 0,
                materialCount: 0,
                totalCount: 0,
                dynamicPriority: player.dynamicPriority || 0
            };
        });

        // 分配履歴から統計計算
        allocations.forEach(allocation => {
            const position = allocation.position;
            const slot = allocation.slot;
            const week = allocation.week;

            // プレイヤー統計更新
            if (playerStats[position]) {
                if (['武器石', '硬化薬', '強化薬', '強化繊維'].includes(slot)) {
                    playerStats[position].materialCount++;
                } else {
                    playerStats[position].equipmentCount++;
                }
                playerStats[position].totalCount++;
            }

            // 部位統計更新
            slotStats[slot] = (slotStats[slot] || 0) + 1;

            // 週統計更新
            weekStats[week] = (weekStats[week] || 0) + 1;
        });

        return { playerStats, slotStats, weekStats };
    } catch (error) {
        console.error('統計計算エラー:', error);
        return { playerStats: {}, slotStats: {}, weekStats: {} };
    }
}

/**
 * 編集可能なプレイヤー統計を生成
 */
function generateEditablePlayerStatistics(players, allocations) {
    try {
        const positions = ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];
        const equipmentSlots = ['武器箱', '第一希望武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];
        const materialSlots = ['武器石', '硬化薬', '強化薬', '強化繊維'];

        let html = '<div class="player-stats-table editable">';

        // ヘッダー
        html += `
            <div class="stats-header">
                <div class="player-name-col">プレイヤー</div>
                ${equipmentSlots.map(slot => `<div class="slot-col">${slot}</div>`).join('')}
                ${materialSlots.map(slot => `<div class="slot-col">${slot}</div>`).join('')}
            </div>
        `;

        // 各プレイヤーの行
        positions.forEach(position => {
            const player = players[position];
            if (!player) return;

            html += `
                <div class="stats-row">
                    <div class="player-name-col">
                        <span class="player-name">${player.name}</span>
                        <span class="position-tag ${getPositionRoleClass(position)}">${position}</span>
                    </div>
            `;

            // 装備スロット
            equipmentSlots.forEach(slot => {
                const allocation = allocations.find(a => a.position === position && a.slot === slot);
                const checked = allocation ? 'checked' : '';
                html += `<div class="slot-col">
                    <input type="checkbox" ${checked} data-position="${position}" data-slot="${slot}">
                </div>`;
            });

            // 素材スロット（カウンター）
            materialSlots.forEach(slot => {
                const count = allocations.filter(a => a.position === position && a.slot === slot).length;
                html += `<div class="slot-col">
                    <input type="number" min="0" max="99" value="${count}"
                           data-position="${position}" data-slot="${slot}" style="width: 50px;">
                </div>`;
            });

            html += '</div>';
        });

        html += '</div>';
        return html;
    } catch (error) {
        console.error('編集可能統計生成エラー:', error);
        return '<div class="error">統計情報の生成に失敗しました</div>';
    }
}

/**
 * 統計情報を保存
 */
async function saveStatistics() {
    try {
        showMessage('統計情報を保存中...', 'info');

        // グローバルスコープから参照
        const appData = window.appData;
        const currentRaidTier = window.currentRaidTier;
        const saveDataToSupabase = window.saveDataToSupabase;

        if (!appData || !currentRaidTier) {
            showError('アプリケーションデータが初期化されていません');
            return;
        }

        // 編集内容を収集
        const newAllocations = [];
        const checkboxes = document.querySelectorAll('.player-stats-table.editable input[type="checkbox"]');
        const numberInputs = document.querySelectorAll('.player-stats-table.editable input[type="number"]');

        // チェックボックス（装備）
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                newAllocations.push({
                    position: checkbox.dataset.position,
                    slot: checkbox.dataset.slot,
                    layer: 1, // デフォルト値
                    week: 1,  // デフォルト値
                    timestamp: new Date().toISOString()
                });
            }
        });

        // 数値入力（素材）
        numberInputs.forEach(input => {
            const count = parseInt(input.value) || 0;
            for (let i = 0; i < count; i++) {
                newAllocations.push({
                    position: input.dataset.position,
                    slot: input.dataset.slot,
                    layer: 1,
                    week: 1,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // データを更新
        appData.allocations[currentRaidTier.id] = newAllocations;

        // Supabaseに保存
        if (typeof saveDataToSupabase === 'function') {
            await saveDataToSupabase('allocations', newAllocations);
        }

        showSuccess('統計情報を保存しました');

        // 統計表示に戻る
        setTimeout(() => showStatistics(), 1000);

    } catch (error) {
        console.error('統計保存エラー:', error);
        showError('統計情報の保存に失敗しました: ' + error.message);
    }
}

/**
 * 統計編集モードを表示
 */
function showStatisticsEditMode() {
    try {
        const content = document.getElementById('content');
        if (!content) {
            console.error('Content element not found');
            showError('画面要素が見つかりません');
            return;
        }

        // グローバルスコープから参照
        const appData = window.appData;
        const currentRaidTier = window.currentRaidTier;

        if (!appData || !currentRaidTier) {
            showError('アプリケーションデータが初期化されていません');
            return;
        }

        const players = appData.players[currentRaidTier.id] || {};
        const allocations = appData.allocations[currentRaidTier.id] || [];

        if (Object.keys(players).length === 0) {
            showError('プレイヤー情報が設定されていません。');
            return;
        }

        content.innerHTML = `
            <div class="navigation-top-left">
                <button class="nav-button" onclick="showStatistics()">統計表示に戻る</button>
            </div>

            <h1>統計情報編集</h1>
            <h2>${currentRaidTier.name}</h2>

            <div class="section">
                <h3>プレイヤー別取得状況編集
                    <button class="save-button" onclick="saveStatistics()" style="margin-left: 20px;">保存</button>
                </h3>
                <div id="editableStats">
                    ${generateEditablePlayerStatistics(players, allocations)}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('統計編集モード表示エラー:', error);
        showError('統計編集モードの表示に失敗しました');
    }
}

/**
 * 分配履歴を表示
 */
function showAllocationHistory() {
    try {
        const content = document.getElementById('content');
        if (!content) {
            console.error('Content element not found');
            showError('画面要素が見つかりません');
            return;
        }

        // グローバルスコープから参照
        const appData = window.appData;
        const currentRaidTier = window.currentRaidTier;

        if (!appData || !currentRaidTier) {
            showError('アプリケーションデータが初期化されていません');
            return;
        }

        const allocations = appData.allocations[currentRaidTier.id] || [];
        const players = appData.players[currentRaidTier.id] || {};

        content.innerHTML = `
            <div class="navigation-top-left">
                <button class="nav-button" onclick="showTierDashboard()">レイドダッシュボードに戻る</button>
            </div>

            <h1>分配履歴</h1>
            <h2>${currentRaidTier.name}</h2>

            <div class="section">
                <h3>フィルター</h3>
                <div class="filter-controls">
                    <div class="filter-group">
                        <label>層:</label>
                        <select id="layerFilter" onchange="filterAllocationHistory()">
                            <option value="">全て</option>
                            <option value="1">1層</option>
                            <option value="2">2層</option>
                            <option value="3">3層</option>
                            <option value="4">4層</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label>取得者:</label>
                        <select id="playerFilter" onchange="filterAllocationHistory()">
                            <option value="">全て</option>
                            ${Object.entries(players).map(([position, player]) => `
                                <option value="${position}">${player.name} (${position})</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="filter-group">
                        <label>装備部位:</label>
                        <select id="slotFilter" onchange="filterAllocationHistory()">
                            <option value="">全て</option>
                            <option value="武器箱">武器箱</option>
                            <option value="直ドロップ武器">直ドロップ武器</option>
                            <option value="頭">頭</option>
                            <option value="胴">胴</option>
                            <option value="手">手</option>
                            <option value="脚">脚</option>
                            <option value="足">足</option>
                            <option value="耳">耳</option>
                            <option value="首">首</option>
                            <option value="腕">腕</option>
                            <option value="指">指</option>
                            <option value="武器石">武器石</option>
                            <option value="硬化薬">硬化薬</option>
                            <option value="強化薬">強化薬</option>
                            <option value="強化繊維">強化繊維</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="section">
                <h3>分配履歴 (${allocations.length}件)</h3>
                <div id="historyTable">
                    ${generateHistoryTable(allocations, players)}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('履歴表示エラー:', error);
        showError('分配履歴の表示に失敗しました');
    }
}

/**
 * 履歴テーブルを生成
 */
function generateHistoryTable(allocations, players) {
    try {
        if (allocations.length === 0) {
            return '<div class="no-data">分配履歴はありません</div>';
        }

        let html = `
            <div class="history-table">
                <div class="history-header">
                    <div class="col-week">週</div>
                    <div class="col-layer">層</div>
                    <div class="col-slot">部位</div>
                    <div class="col-player">取得者</div>
                    <div class="col-date">日時</div>
                </div>
        `;

        // 履歴を日時順（新しい順）でソート
        const sortedAllocations = [...allocations].sort((a, b) =>
            new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        );

        sortedAllocations.forEach(allocation => {
            const player = players[allocation.position];
            const playerName = player ? player.name : allocation.position;
            const date = allocation.timestamp ?
                new Date(allocation.timestamp).toLocaleString('ja-JP') : '不明';

            html += `
                <div class="history-row">
                    <div class="col-week">${allocation.week}週目</div>
                    <div class="col-layer">${allocation.layer}層</div>
                    <div class="col-slot">${allocation.slot}</div>
                    <div class="col-player">
                        <span class="player-name">${playerName}</span>
                        <span class="position-tag ${getPositionRoleClass(allocation.position)}">${allocation.position}</span>
                    </div>
                    <div class="col-date">${date}</div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    } catch (error) {
        console.error('履歴テーブル生成エラー:', error);
        return '<div class="error">履歴テーブルの生成に失敗しました</div>';
    }
}

/**
 * 分配履歴をフィルター
 */
function filterAllocationHistory() {
    try {
        const layerFilter = document.getElementById('layerFilter').value;
        const playerFilter = document.getElementById('playerFilter').value;
        const slotFilter = document.getElementById('slotFilter').value;

        // グローバルスコープから参照
        const appData = window.appData;
        const currentRaidTier = window.currentRaidTier;

        if (!appData || !currentRaidTier) {
            showError('アプリケーションデータが初期化されていません');
            return;
        }

        const allocations = appData.allocations[currentRaidTier.id] || [];
        const players = appData.players[currentRaidTier.id] || {};

        let filteredAllocations = allocations.filter(allocation => {
            if (layerFilter && allocation.layer.toString() !== layerFilter) {
                return false;
            }
            if (playerFilter && allocation.position !== playerFilter) {
                return false;
            }
            if (slotFilter && allocation.slot !== slotFilter) {
                return false;
            }
            return true;
        });

        const historyTable = document.getElementById('historyTable');
        if (historyTable) {
            historyTable.innerHTML = generateHistoryTable(filteredAllocations, players);
        }

        // フィルター結果の件数を更新
        const sectionTitle = document.querySelector('.section h3');
        if (sectionTitle) {
            sectionTitle.textContent = `分配履歴 (${filteredAllocations.length}件)`;
        }
    } catch (error) {
        console.error('履歴フィルターエラー:', error);
        showError('履歴のフィルタリングに失敗しました');
    }
}

// グローバルスコープに関数を登録（下位互換性のため）
if (typeof window !== 'undefined') {
    window.showStatistics = showStatistics;
    window.generatePlayerStatistics = generatePlayerStatistics;
    window.calculateStatistics = calculateStatistics;
    window.showStatisticsEditMode = showStatisticsEditMode;
    window.generateEditablePlayerStatistics = generateEditablePlayerStatistics;
    window.saveStatistics = saveStatistics;
    window.showAllocationHistory = showAllocationHistory;
    window.generateHistoryTable = generateHistoryTable;
    window.filterAllocationHistory = filterAllocationHistory;
}