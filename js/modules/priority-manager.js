// 優先順位管理モジュール

// 優先順位管理画面
function showPriorityManagement() {
    const content = document.getElementById('content');
    const players = window.appData.players[window.currentRaidTier.id] || {};

    if (Object.keys(players).length === 0) {
        showError('プレイヤー情報が設定されていません。まずメンバー管理から設定してください。');
        return;
    }

    // 現在の優先順位を取得（デフォルト: D1→D2→D3→D4→MT→ST→H1→H2）
    const defaultPriority = ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];
    const currentPriority = window.appData.settings?.positionPriority || defaultPriority;

    content.innerHTML = `
        <div class="navigation-top-left">
            <button class="nav-button" onclick="showTierDashboard()">レイドダッシュボードに戻る</button>
        </div>

        <h1>ポジション間優先順位設定</h1>
        <h2>${window.currentRaidTier.name}</h2>

        <div class="section">
            <h3>ポジション間優先順位設定</h3>
            <p>装備・素材すべての判定ロジックに作用する優先順位です。ドラッグ&ドロップで順序を変更できます。</p>

            <div class="priority-container">
                <div class="priority-list" id="priorityList">
                    ${currentPriority.map((position, index) => {
                        const player = players[position];
                        if (!player) return '';

                        // ロール別クラス判定
                        const roleClass = getPositionRoleClass(position);

                        return `
                            <div class="priority-item" data-position="${position}" draggable="true">
                                <div class="priority-rank">${index + 1}</div>
                                <div class="priority-info">
                                    <span class="position-badge ${roleClass}">${position}</span>
                                    <span class="player-name">${player.name}</span>
                                    <span class="player-job">[${player.job}]</span>
                                </div>
                                <div class="drag-handle">⋮⋮</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="priority-actions">
                <button onclick="savePrioritySettings()" class="primary-btn">
                    優先順位を保存
                </button>
                <button onclick="resetPrioritySettings()" class="secondary-btn">
                    デフォルトに戻す
                </button>
            </div>
        </div>

        <div class="section" style="background-color: #f8f9fa; border-left: 4px solid #17a2b8;">
            <h4>💡 優先順位の仕組み</h4>
            <p><strong>装備分配：</strong> 装備方針（零式/トームストーン）とポジション優先順位の組み合わせで取得者を決定</p>
            <p><strong>素材分配：</strong> ポジション優先順位に基づいて武器石、硬化薬、強化薬、強化繊維の取得者を決定</p>
            <p><strong>武器分配：</strong> 武器希望順位とポジション優先順位の組み合わせで取得者を決定</p>
            <p><strong>Note：</strong> 優先順位は装備・素材すべての判定ロジックに作用します。ドラッグ&ドロップで順序を調整できます。</p>
        </div>
    `;

    // ドラッグ&ドロップ機能を初期化
    initializeDragAndDrop();
}

// ドラッグ&ドロップ機能初期化
function initializeDragAndDrop() {
    const priorityList = document.getElementById('priorityList');
    if (!priorityList) return;

    let draggedElement = null;

    priorityList.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('priority-item')) {
            draggedElement = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    priorityList.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('priority-item')) {
            e.target.classList.remove('dragging');
            draggedElement = null;
            // 全ての drag-over クラスを削除
            document.querySelectorAll('.priority-item').forEach(item => {
                item.classList.remove('drag-over');
            });
        }
    });

    priorityList.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // ドラッグされている要素以外にホバー効果を適用
        const closestItem = e.target.closest('.priority-item');
        if (closestItem && closestItem !== draggedElement) {
            // 全ての drag-over クラスを削除
            document.querySelectorAll('.priority-item').forEach(item => {
                item.classList.remove('drag-over');
            });
            // 現在の要素に drag-over クラスを追加
            closestItem.classList.add('drag-over');
        }
    });

    priorityList.addEventListener('dragleave', function(e) {
        const closestItem = e.target.closest('.priority-item');
        if (closestItem && !priorityList.contains(e.relatedTarget)) {
            closestItem.classList.remove('drag-over');
        }
    });

    priorityList.addEventListener('drop', function(e) {
        e.preventDefault();

        const closestItem = e.target.closest('.priority-item');
        if (draggedElement && closestItem && draggedElement !== closestItem) {
            // ドロップ位置を計算
            const rect = closestItem.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;

            if (e.clientY < midpoint) {
                // 上半分にドロップ - 前に挿入
                priorityList.insertBefore(draggedElement, closestItem);
            } else {
                // 下半分にドロップ - 後に挿入
                priorityList.insertBefore(draggedElement, closestItem.nextSibling);
            }

            updatePriorityNumbers();
        }

        // 全ての drag-over クラスを削除
        document.querySelectorAll('.priority-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    });
}

// 優先順位番号更新
function updatePriorityNumbers() {
    const items = document.querySelectorAll('.priority-item');
    items.forEach((item, index) => {
        const rankElement = item.querySelector('.priority-rank');
        if (rankElement) {
            rankElement.textContent = index + 1;
        }
    });
}

// 優先順位設定保存
async function savePrioritySettings() {
    try {
        const items = document.querySelectorAll('.priority-item');
        const newPriority = Array.from(items).map(item => item.dataset.position);

        // 設定を保存
        if (!window.appData.settings) window.appData.settings = {};
        window.appData.settings.positionPriority = newPriority;

        // Supabaseに保存
        const { error } = await window.supabaseClient
            .from('raid_data')
            .upsert({
                team_id: window.currentTeamId,
                tier_id: window.currentRaidTier.id,
                data_type: 'settings',
                content: { positionPriority: newPriority }
            });

        if (error) {
            throw new Error(`保存エラー: ${error.message}`);
        }

        showSuccess('優先順位設定を保存しました');

    } catch (error) {
        console.error('優先順位保存エラー:', error);
        showError('優先順位設定の保存に失敗しました: ' + error.message);
    }
}

// 優先順位設定リセット
async function resetPrioritySettings() {
    if (confirm('優先順位をデフォルト（D1→D2→D3→D4→MT→ST→H1→H2）に戻しますか？')) {
        const defaultPriority = ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];

        // 設定をリセット
        if (!window.appData.settings) {
            window.appData.settings = {};
        }
        window.appData.settings.positionPriority = defaultPriority;

        // Supabaseに保存
        try {
            await saveDataToSupabase('settings', { positionPriority: defaultPriority });
            showSuccess('優先順位をデフォルトに戻しました');
        } catch (error) {
            console.error('設定保存エラー:', error);
            showError('設定の保存に失敗しました');
        }

        // 画面を再読み込み
        showPriorityManagement();
    }
}

export {
    showPriorityManagement,
    savePrioritySettings,
    resetPrioritySettings
};
