// ダッシュボード・メンバー管理モジュール

// ポジションからロールクラスを取得
function getPositionRoleClass(position) {
    if (position === 'MT' || position === 'ST') return 'tank';
    if (position === 'H1' || position === 'H2') return 'healer';
    return 'dps';
}

// ティア固有ダッシュボード
function showTierDashboard() {
    if (!window.currentRaidTier) return;

    const content = document.getElementById('content');
    const players = window.appData.players[window.currentRaidTier.id] || {};
    const positions = ['MT', 'ST', 'D1', 'D2', 'D3', 'D4', 'H1', 'H2'];

    content.innerHTML = `
        <h1>${window.currentRaidTier.name}</h1>

        <div class="section dashboard-controls">
            <div class="dashboard-layer-grid">
                <button class="dashboard-layer-button" onclick="showLayerAllocation(1)">1層</button>
                <button class="dashboard-layer-button" onclick="showLayerAllocation(2)">2層</button>
                <button class="dashboard-layer-button" onclick="showLayerAllocation(3)">3層</button>
                <button class="dashboard-layer-button" onclick="showLayerAllocation(4)">4層</button>
                <button class="dashboard-layer-button" onclick="showPriorityManagement()">優先順位設定</button>
                <button class="dashboard-layer-button" onclick="showStatistics()">統計情報</button>
                <button class="dashboard-layer-button" onclick="showAllocationHistory()">配布履歴</button>
            </div>
        </div>

        <div class="section member-section">
            <h3>メンバー設定</h3>
            ${renderIntegratedMemberTable(players, positions)}
        </div>
    `;
}

// 一体化メンバーテーブルのレンダリング
function renderIntegratedMemberTable(players, positions) {
    const slots = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];
    // ポジション順（MT, ST, D1-D4, H1, H2）に並べ替え
    const allWeapons = [
        'ナイト', '戦士', '暗黒騎士', 'ガンブレイカー', // MT, ST
        'モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー', // D1, D2
        '吟遊詩人', '機工士', '踊り子', // D3
        '黒魔道士', '召喚士', '赤魔道士', 'ピクトマンサー', // D4
        '白魔道士', '占星術士', // H1
        '学者', '賢者' // H2
    ];

    const roleJobs = {
        'MT': ['ナイト', '戦士', '暗黒騎士', 'ガンブレイカー'],
        'ST': ['ナイト', '戦士', '暗黒騎士', 'ガンブレイカー'],
        'H1': ['白魔道士', '占星術士'],
        'H2': ['学者', '賢者'],
        'D1': ['モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー'],
        'D2': ['モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー'],
        'D3': ['吟遊詩人', '機工士', '踊り子'],
        'D4': ['黒魔道士', '召喚士', '赤魔道士', 'ピクトマンサー']
    };

    return `
        <div class="integrated-table-container">
            <table class="integrated-member-table">
                <thead>
                    <tr>
                        <th style="width: 45px;">ロール</th>
                        <th style="width: 120px;">名前</th>
                        <th style="width: 130px;">ジョブ</th>
                        <th colspan="10" style="text-align: center;">装備方針（空白=トームストーン）</th>
                        <th style="width: 130px;">武器第2希望</th>
                        <th style="width: 130px;">武器第3希望</th>
                    </tr>
                    <tr>
                        <th colspan="3"></th>
                        ${slots.map(slot => `<th style="width: 45px; font-size: 12px;">${slot}</th>`).join('')}
                        <th colspan="2"></th>
                    </tr>
                </thead>
                <tbody>
                    ${positions.map(position => {
                        const player = players[position] || {};
                        const mainWeapon = player.job || '';
                        const weaponWishes = player.weaponWishes || [];

                        return `
                            <tr data-position="${position}">
                                <td class="position-cell ${getPositionRoleClass(position)}">${position}</td>
                                <td>
                                    <input type="text"
                                           class="table-input"
                                           id="integrated-${position}-name"
                                           value="${player.name || ''}"
                                           placeholder="名前">
                                </td>
                                <td>
                                    <select class="table-select" id="integrated-${position}-job">
                                        <option value="">選択</option>
                                        ${roleJobs[position].map(job => `
                                            <option value="${job}" ${player.job === job ? 'selected' : ''}>${job}</option>
                                        `).join('')}
                                    </select>
                                </td>
                                ${slots.map(slot => {
                                    const isRaid = player.equipmentPolicy && player.equipmentPolicy[slot] === '零式';
                                    return `
                                        <td class="policy-cell ${isRaid ? 'policy-raid' : ''}"
                                            onclick="togglePolicyCell('${position}', '${slot}')"
                                            data-position="${position}"
                                            data-slot="${slot}">
                                            ${isRaid ? '零式' : ''}
                                        </td>
                                    `;
                                }).join('')}
                                <td>
                                    <select class="table-select" id="integrated-${position}-weapon2">
                                        <option value="">選択</option>
                                        ${allWeapons.filter(w => w !== mainWeapon).map(job => `
                                            <option value="${job}" ${weaponWishes[1] === job ? 'selected' : ''}>${job}</option>
                                        `).join('')}
                                    </select>
                                </td>
                                <td>
                                    <select class="table-select" id="integrated-${position}-weapon3">
                                        <option value="">選択</option>
                                        ${allWeapons.filter(w => w !== mainWeapon).map(job => `
                                            <option value="${job}" ${weaponWishes[2] === job ? 'selected' : ''}>${job}</option>
                                        `).join('')}
                                    </select>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div style="text-align: center; margin-top: 15px;">
                <button class="save-btn" onclick="saveIntegratedMemberData()">一括保存</button>
            </div>
        </div>
    `;
}

// 装備方針セルのクリック切り替え
function togglePolicyCell(position, slot) {
    const cell = document.querySelector(`.policy-cell[data-position="${position}"][data-slot="${slot}"]`);
    if (!cell) return;

    const isCurrentlyRaid = cell.classList.contains('policy-raid');

    if (isCurrentlyRaid) {
        cell.classList.remove('policy-raid');
        cell.textContent = '';
    } else {
        cell.classList.add('policy-raid');
        cell.textContent = '零式';
    }
}

// 一体化テーブルのデータ保存
async function saveIntegratedMemberData() {
    try {
        const positions = ['MT', 'ST', 'D1', 'D2', 'D3', 'D4', 'H1', 'H2'];
        const slots = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];
        const players = {};

        // 各プレイヤーのデータを収集
        for (const position of positions) {
            const nameInput = document.getElementById(`integrated-${position}-name`);
            const jobSelect = document.getElementById(`integrated-${position}-job`);
            const weapon2Select = document.getElementById(`integrated-${position}-weapon2`);
            const weapon3Select = document.getElementById(`integrated-${position}-weapon3`);

            const name = nameInput?.value.trim();
            const job = jobSelect?.value;

            // 名前とジョブが入力されている場合のみ保存
            if (name && job) {
                // 装備方針の収集
                const equipmentPolicy = {};
                for (const slot of slots) {
                    const cell = document.querySelector(`.policy-cell[data-position="${position}"][data-slot="${slot}"]`);
                    equipmentPolicy[slot] = cell?.classList.contains('policy-raid') ? '零式' : 'トームストーン';
                }

                // 武器希望の収集
                const weaponWishes = [
                    job, // 第一希望は必ずメインジョブ
                    weapon2Select?.value || '',
                    weapon3Select?.value || '',
                    '' // 第四希望は省略
                ];

                // 既存データがある場合は保持
                const existingPlayer = window.appData.players[window.currentRaidTier.id]?.[position] || {};

                players[position] = {
                    name,
                    job,
                    position,  // ポジション情報を追加
                    equipmentPolicy,
                    weaponWishes,
                    currentEquipment: existingPlayer.currentEquipment || {},
                    dynamicPriority: existingPlayer.dynamicPriority || 0,
                    allocationHistory: existingPlayer.allocationHistory || []
                };
            }
        }

        // データ検証
        if (Object.keys(players).length === 0) {
            showError('少なくとも1人のメンバー情報を入力してください');
            return;
        }

        // appDataに保存
        if (!window.appData.players) window.appData.players = {};
        window.appData.players[window.currentRaidTier.id] = players;

        // Supabaseに保存
        await saveDataToSupabase('players', players);

        showSuccess(`${Object.keys(players).length}人のメンバー情報を保存しました`);

    } catch (error) {
        console.error('メンバーデータ保存エラー:', error);
        showError('メンバー情報の保存に失敗しました: ' + error.message);
    }
}

export {
    showTierDashboard,
    togglePolicyCell,
    saveIntegratedMemberData,
    getPositionRoleClass
};
