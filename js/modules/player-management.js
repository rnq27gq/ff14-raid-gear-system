// プレイヤー管理モジュール（タブ形式）

// プレイヤー管理画面のエントリーポイント
function showPlayerManagement() {
    showPlayerSetup();
}

// プレイヤー設定画面（タブ形式）
function showPlayerSetup() {
    showTabbedSetup('players');
}

// タブ形式のセットアップ画面
function showTabbedSetup(activeTab = 'players') {
    const content = document.getElementById('content');

    content.innerHTML = `
        <h1>メンバー・装備設定</h1>
        <h2>${window.currentRaidTier.name}</h2>

        <div class="section">
            <div class="navigation">
                <button class="nav-button" onclick="showTierDashboard()">レイドダッシュボードに戻る</button>
            </div>
        </div>

        <div class="tab-container">
            <div class="tab-nav">
                <button class="tab-button ${activeTab === 'players' ? 'active' : ''}" onclick="showTabbedSetup('players')">
                    メンバー情報
                </button>
                <button class="tab-button ${activeTab === 'policy' ? 'active' : ''}" onclick="showTabbedSetup('policy')">
                    装備方針
                </button>
                <button class="tab-button ${activeTab === 'weapons' ? 'active' : ''}" onclick="showTabbedSetup('weapons')">
                    武器希望
                </button>
            </div>

            <div class="tab-content">
                ${getTabContent(activeTab)}
            </div>

            <div class="navigation" style="display: flex; gap: 10px; justify-content: center; align-items: center;">
                <button class="save-btn" onclick="saveCurrentTab('${activeTab}')">
                    ${activeTab === 'players' ? 'メンバー情報を保存' : activeTab === 'policy' ? '装備方針を保存' : '武器希望を保存'}
                </button>
                <button class="nav-button" onclick="saveCurrentTabAndContinue('${activeTab}')">
                    設定完了
                </button>
            </div>
        </div>
    `;
}

// タブコンテンツ生成
function getTabContent(tabName) {
    const players = window.appData.players[window.currentRaidTier.id] || {};
    const positions = ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];

    if (tabName === 'players') {
        return `
            <h3>8人のメンバー情報を入力してください</h3>
            <div class="player-grid">
                ${positions.map(position => {
                    const player = players[position] || {};
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
                        <div class="player-card">
                            <div class="player-header">
                                <span class="position-badge ${getPositionRoleClass(position)}">${position}</span>
                            </div>

                            <div style="margin: 10px 0;">
                                <label>プレイヤー名（必須）:</label>
                                <input type="text" id="${position}-name" value="${player.name || ''}"
                                       placeholder="プレイヤー名を入力" class="job-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem;">
                            </div>


                            <div style="margin: 10px 0;">
                                <label>ジョブ（必須）:</label>
                                <select id="${position}-job" class="job-select">
                                    <option value="">ジョブを選択</option>
                                    ${roleJobs[position].map(job => `
                                        <option value="${job}" ${player.job === job ? 'selected' : ''}>${job}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else if (tabName === 'policy') {
        if (Object.keys(players).length === 0) {
            return `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <p>まずメンバー情報タブでプレイヤー情報を設定してください。</p>
                </div>
            `;
        }

        const slots = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];

        return `
            <h3>各プレイヤーの装備方針を設定</h3>
            <p>零式：零式装備を優先取得、トームストーン：トームストーン装備で十分</p>
            <div class="player-grid">
                ${positions.map(position => {
                    const player = players[position];
                    if (!player) return '';

                    return `
                        <div class="player-card">
                            <div class="player-header">
                                <span class="player-name">${player.name}</span>
                                <span class="position-badge ${getPositionRoleClass(position)}">${position} - ${player.job}</span>
                            </div>
                            <div class="equipment-policy">
                                <div class="policy-grid">
                                    ${slots.map(slot => `
                                        <div class="policy-item">
                                            <label>${slot}</label>
                                            <select id="${position}-${slot}-policy">
                                                <option value="零式" ${(player.equipmentPolicy && player.equipmentPolicy[slot] === '零式') ? 'selected' : ''}>零式</option>
                                                <option value="トームストーン" ${(player.equipmentPolicy && player.equipmentPolicy[slot] === 'トームストーン') ? 'selected' : ''}>トームストーン</option>
                                            </select>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else if (tabName === 'weapons') {
        if (Object.keys(players).length === 0) {
            return `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <p>まずメンバー情報タブでプレイヤー情報を設定してください。</p>
                </div>
            `;
        }

        // ポジション順（MT, ST, D1-D4, H1, H2）に並べ替え
        const allWeapons = [
            'ナイト', '戦士', '暗黒騎士', 'ガンブレイカー', // MT, ST
            'モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー', // D1, D2
            '吟遊詩人', '機工士', '踊り子', // D3
            '黒魔道士', '召喚士', '赤魔道士', 'ピクトマンサー', // D4
            '白魔道士', '占星術士', // H1
            '学者', '賢者' // H2
        ];

        return `
            <h3>4層直ドロップ武器の希望順位を設定</h3>
            <p>第一希望は自動的にメインジョブになります。第二〜第四希望を選択してください。</p>
            <div class="player-grid">
                ${positions.map(position => {
                    const player = players[position];
                    if (!player) return '';

                    const weaponWishes = player.weaponWishes || [];
                    const mainWeapon = player.job;

                    return `
                        <div class="player-card">
                            <div class="player-header">
                                <span class="player-name">${player.name}</span>
                                <span class="position-badge ${getPositionRoleClass(position)}">${position} - ${player.job}</span>
                            </div>
                            <div class="weapon-wishes">
                                <div class="wish-priority">
                                    <label>第一希望 (メインジョブ):</label>
                                    <input type="text" value="${mainWeapon}" readonly style="background-color: #e9ecef; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; min-width: 120px;">
                                </div>
                                <div class="wish-priority">
                                    <label>第二希望:</label>
                                    <select id="${position}-weapon-wish-2">
                                        <option value="">選択</option>
                                        ${allWeapons.filter(w => w !== mainWeapon).map(job => `
                                            <option value="${job}" ${weaponWishes[1] === job ? 'selected' : ''}>${job}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="wish-priority">
                                    <label>第三希望:</label>
                                    <select id="${position}-weapon-wish-3">
                                        <option value="">選択</option>
                                        ${allWeapons.filter(w => w !== mainWeapon).map(job => `
                                            <option value="${job}" ${weaponWishes[2] === job ? 'selected' : ''}>${job}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="wish-priority">
                                    <label>第四希望:</label>
                                    <select id="${position}-weapon-wish-4">
                                        <option value="">選択</option>
                                        ${allWeapons.filter(w => w !== mainWeapon).map(job => `
                                            <option value="${job}" ${weaponWishes[3] === job ? 'selected' : ''}>${job}</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    return '';
}

// 現在のタブのみ保存
async function saveCurrentTab(currentTab) {
    try {
        if (currentTab === 'players') {
            await savePlayersData();
            showSuccess('メンバー情報を保存しました');
        } else if (currentTab === 'policy') {
            await saveEquipmentPolicyData();
            showSuccess('装備方針を保存しました');
        } else if (currentTab === 'weapons') {
            await saveWeaponWishesData();
            showSuccess('武器希望を保存しました');
        }
    } catch (error) {
        console.error('保存エラー:', error);
        showError('保存に失敗しました: ' + error.message);
    }
}

// 現在のタブを保存して次へ進む
async function saveCurrentTabAndContinue(currentTab) {
    try {
        if (currentTab === 'players') {
            await savePlayersData();
        } else if (currentTab === 'policy') {
            await saveEquipmentPolicyData();
        } else if (currentTab === 'weapons') {
            await saveWeaponWishesData();
        }

        showSuccess('設定を保存しました');

        // 全て設定済みかチェックしてダッシュボードへ
        if (Object.keys(window.appData.players[window.currentRaidTier.id] || {}).length > 0) {
            showTierDashboard();
        } else {
            showError('メンバー情報が設定されていません。');
        }
    } catch (error) {
        console.error('設定保存エラー:', error);
        showError('設定の保存に失敗しました: ' + error.message);
    }
}

// プレイヤー情報保存
async function savePlayersData() {
    const positions = ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];

    if (!window.appData.players[window.currentRaidTier.id]) {
        window.appData.players[window.currentRaidTier.id] = {};
    }

    for (const position of positions) {
        const nameInput = document.getElementById(`${position}-name`);
        const jobSelect = document.getElementById(`${position}-job`);

        if (!nameInput || !jobSelect) continue;

        const name = nameInput.value.trim();
        const job = jobSelect.value;

        if (!name || !job) {
            throw new Error(`${position}のプレイヤー名とジョブを入力してください。`);
        }

        // 既存データがある場合は保持
        const existingPlayer = window.appData.players[window.currentRaidTier.id][position] || {};

        window.appData.players[window.currentRaidTier.id][position] = {
            name: name,
            job: job,
            position: position,
            equipmentPolicy: existingPlayer.equipmentPolicy || {},
            weaponWishes: existingPlayer.weaponWishes || [],
            currentEquipment: existingPlayer.currentEquipment || {},
            dynamicPriority: existingPlayer.dynamicPriority || 0,
            allocationHistory: existingPlayer.allocationHistory || []
        };
    }

    // Supabaseに保存
    await saveDataToSupabase('players', window.appData.players[window.currentRaidTier.id]);
}

// 装備方針保存
async function saveEquipmentPolicyData() {
    const players = window.appData.players[window.currentRaidTier.id];
    const slots = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];

    for (const [position, player] of Object.entries(players)) {
        for (const slot of slots) {
            const policyElement = document.getElementById(`${position}-${slot}-policy`);
            if (policyElement) {
                const policy = policyElement.value;
                player.equipmentPolicy[slot] = policy;
            }
        }
    }

    // Supabaseに保存
    await saveDataToSupabase('players', window.appData.players[window.currentRaidTier.id]);
}

// タブ専用保存関数（個別保存ボタン用）
async function savePlayersDataTab() {
    try {
        await savePlayersData();
        showSuccess('メンバー情報を保存しました');
    } catch (error) {
        console.error('メンバー情報保存エラー:', error);
        showError('メンバー情報の保存に失敗しました: ' + error.message);
    }
}

async function saveEquipmentPolicyDataTab() {
    try {
        await saveEquipmentPolicyData();
        showSuccess('装備方針を保存しました');
    } catch (error) {
        console.error('装備方針保存エラー:', error);
        showError('装備方針の保存に失敗しました: ' + error.message);
    }
}

async function saveWeaponWishesDataTab() {
    try {
        await saveWeaponWishesData();
        showSuccess('武器希望を保存しました');
    } catch (error) {
        console.error('武器希望保存エラー:', error);
        showError('武器希望の保存に失敗しました: ' + error.message);
    }
}

// 武器希望保存
async function saveWeaponWishesData() {
    const players = window.appData.players[window.currentRaidTier.id];

    for (const [position, player] of Object.entries(players)) {
        const mainJob = player.job;
        const wish2Element = document.getElementById(`${position}-weapon-wish-2`);
        const wish3Element = document.getElementById(`${position}-weapon-wish-3`);
        const wish4Element = document.getElementById(`${position}-weapon-wish-4`);

        // 第一希望はメインジョブ、第二〜第四希望は選択された値
        player.weaponWishes = [
            mainJob,
            wish2Element ? wish2Element.value : '',
            wish3Element ? wish3Element.value : '',
            wish4Element ? wish4Element.value : ''
        ].filter(wish => wish !== ''); // 空の値を除外
    }

    // Supabaseに保存
    await saveDataToSupabase('players', window.appData.players[window.currentRaidTier.id]);
}

export {
    showPlayerManagement,
    showPlayerSetup,
    showTabbedSetup,
    saveCurrentTab,
    saveCurrentTabAndContinue
};
