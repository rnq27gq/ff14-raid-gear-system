// FF14零式装備分配システム - メインアプリケーション

// グローバル変数定義
let database;
let currentScreen = 'raidTierSelection';
let currentRaidTier = null;
let players = {};

// 初期化処理
document.addEventListener('DOMContentLoaded', function() {
    if (typeof DatabaseService !== 'undefined') {
        database = new DatabaseService();
    } else {
        // 簡易データベース (フォールバック実装)
        database = {
            getRaidTiers: () => JSON.parse(localStorage.getItem('raidTiers') || '[]'),
            createRaidTier: (name, desc) => {
                const tiers = JSON.parse(localStorage.getItem('raidTiers') || '[]');
                const newTier = { id: Date.now().toString(), name, description: desc, createdAt: new Date() };
                tiers.push(newTier);
                localStorage.setItem('raidTiers', JSON.stringify(tiers));
                return newTier;
            },
            setActiveRaidTier: (id) => {
                localStorage.setItem('activeRaidTierId', id);
                return true;
            },
            getActiveRaidTier: () => {
                const id = localStorage.getItem('activeRaidTierId');
                const tiers = JSON.parse(localStorage.getItem('raidTiers') || '[]');
                return tiers.find(t => t.id === id) || null;
            }
        };
    }
    
    showRaidTierSelection();
});

// レイドティア選択画面表示
function showRaidTierSelection() {
    const app = document.querySelector('.container');
    const raidTiers = database.getRaidTiers();
    
    app.innerHTML = `
        <h1>FF14 零式装備分配システム</h1>
        
        <div class="section">
            <h2>レイドティア選択</h2>
            <div id="existing-tiers">
                ${raidTiers.length > 0 ? `
                    <h3>既存のレイドティア</h3>
                    <div class="tier-list">
                        ${raidTiers.map(tier => `
                            <div class="tier-item" onclick="selectRaidTier('${tier.id}')">
                                <h4>${tier.name}</h4>
                                <p>${tier.description || '説明なし'}</p>
                                <small>作成日: ${new Date(tier.createdAt).toLocaleDateString('ja-JP')}</small>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>まだレイドティアが登録されていません。</p>'}
            </div>
            
            <div class="new-tier-form">
                <h3>新規レイドティア登録</h3>
                <input type="text" id="tier-name" placeholder="レイドティア名（例：7.2零式）" required>
                <input type="text" id="tier-description" placeholder="説明（任意）">
                <button onclick="createNewRaidTier()">登録</button>
            </div>
        </div>
    `;
    
    // CSSスタイル追加
    if (!document.getElementById('tier-styles')) {
        const style = document.createElement('style');
        style.id = 'tier-styles';
        style.textContent = `
            .tier-list {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin: 15px 0;
            }
            .tier-item {
                background-color: #0f3460;
                padding: 15px;
                border-radius: 8px;
                cursor: pointer;
                transition: background-color 0.3s;
                border: 2px solid transparent;
            }
            .tier-item:hover {
                background-color: #1e5f8b;
                border-color: #ffd700;
            }
            .tier-item h4 {
                margin: 0 0 8px 0;
                color: #ffd700;
            }
            .tier-item p {
                margin: 5px 0;
                color: #ccc;
            }
            .tier-item small {
                color: #999;
            }
            .new-tier-form {
                margin-top: 30px;
                padding: 20px;
                background-color: #16213e;
                border-radius: 8px;
            }
            .new-tier-form input {
                display: block;
                width: 100%;
                margin: 10px 0;
                padding: 10px;
                border: 1px solid #0f3460;
                border-radius: 5px;
                background-color: #1a1a2e;
                color: white;
                box-sizing: border-box;
            }
            .new-tier-form button {
                margin-top: 10px;
            }
        `;
        document.head.appendChild(style);
    }
}

// レイドティア選択
function selectRaidTier(tierId) {
    if (database.setActiveRaidTier(tierId)) {
        currentRaidTier = database.getActiveRaidTier();
        showInitialSetup();
    }
}

// 新規レイドティア登録
function createNewRaidTier() {
    const name = document.getElementById('tier-name').value.trim();
    const description = document.getElementById('tier-description').value.trim();
    
    if (!name) {
        alert('レイドティア名を入力してください。');
        return;
    }
    
    const newTier = database.createRaidTier(name, description);
    selectRaidTier(newTier.id);
}

// 初期設定画面表示
function showInitialSetup() {
    const app = document.querySelector('.container');
    
    app.innerHTML = `
        <h1>初期設定 - ${currentRaidTier.name}</h1>
        
        <div class="setup-navigation">
            <button class="nav-btn active" onclick="showMemberSetup()">メンバー設定</button>
            <button class="nav-btn" onclick="showEquipmentPolicySetup()">装備設定</button>
            <button class="nav-btn" onclick="showWeaponWishSetup()">武器設定</button>
            <button class="nav-btn" onclick="completeSetup()">設定完了</button>
        </div>
        
        <div id="setup-content">
            <!-- 設定内容が動的に表示される -->
        </div>
        
        <div class="setup-actions">
            <button onclick="showRaidTierSelection()">レイドティア選択に戻る</button>
        </div>
    `;
    
    // ナビゲーションスタイル追加
    if (!document.getElementById('setup-styles')) {
        const style = document.createElement('style');
        style.id = 'setup-styles';
        style.textContent = `
            .setup-navigation {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                border-bottom: 2px solid #0f3460;
                padding-bottom: 10px;
            }
            .nav-btn {
                padding: 10px 20px;
                background-color: #16213e;
                border: 1px solid #0f3460;
                color: #ccc;
                cursor: pointer;
                border-radius: 5px 5px 0 0;
            }
            .nav-btn.active {
                background-color: #0f3460;
                color: #ffd700;
                border-bottom: 2px solid #ffd700;
            }
            .nav-btn:hover:not(.active) {
                background-color: #1e5f8b;
                color: white;
            }
            .setup-actions {
                margin-top: 30px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }
    
    showMemberSetup();
}

// メンバー設定表示
function showMemberSetup() {
    // ナビゲーションの状態更新
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
    
    const content = document.getElementById('setup-content');
    content.innerHTML = `
        <div class="section">
            <h2>8名のメンバー設定</h2>
            <div class="member-grid">
                ${['MT', 'ST', 'H1', 'H2', 'D1', 'D2', 'D3', 'D4'].map(position => `
                    <div class="member-card">
                        <h3>${position}</h3>
                        <input type="text" id="name-${position}" placeholder="プレイヤー名" />
                        <input type="text" id="char-${position}" placeholder="キャラクター名" />
                        <select id="job-${position}">
                            <option value="">ジョブを選択</option>
                            ${getJobOptionsForPosition(position)}
                        </select>
                    </div>
                `).join('')}
            </div>
            <button onclick="saveMemberSettings()">メンバー設定を保存</button>
        </div>
    `;
    
    // メンバー設定のスタイル追加
    if (!document.getElementById('member-styles')) {
        const style = document.createElement('style');
        style.id = 'member-styles';
        style.textContent = `
            .member-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            .member-card {
                background-color: #16213e;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #0f3460;
            }
            .member-card h3 {
                margin: 0 0 10px 0;
                color: #ffd700;
                text-align: center;
            }
            .member-card input, .member-card select {
                width: 100%;
                margin: 5px 0;
                box-sizing: border-box;
            }
        `;
        document.head.appendChild(style);
    }
}

// ポジション別のジョブオプション取得
function getJobOptionsForPosition(position) {
    const jobsByPosition = {
        'MT': ['ナイト', '戦士', '暗黒騎士', 'ガンブレイカー'],
        'ST': ['ナイト', '戦士', '暗黒騎士', 'ガンブレイカー'],
        'H1': ['白魔道士', '占星術士'],
        'H2': ['学者', '賢者'],
        'D1': ['モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー'],
        'D2': ['モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー'],
        'D3': ['吟遊詩人', '機工士', '踊り子', '黒魔道士', '召喚士', '赤魔道士', 'ピクトマンサー'],
        'D4': ['吟遊詩人', '機工士', '踊り子', '黒魔道士', '召喚士', '赤魔道士', 'ピクトマンサー']
    };
    
    return jobsByPosition[position].map(job => `<option value="${job}">${job}</option>`).join('');
}

// メンバー設定の保存
function saveMemberSettings() {
    const positions = ['MT', 'ST', 'H1', 'H2', 'D1', 'D2', 'D3', 'D4'];
    players = {};
    
    for (const position of positions) {
        const name = document.getElementById(`name-${position}`).value.trim();
        const characterName = document.getElementById(`char-${position}`).value.trim();
        const job = document.getElementById(`job-${position}`).value;
        
        if (!name || !characterName || !job) {
            alert(`${position}の設定が不完全です。すべての項目を入力してください。`);
            return;
        }
        
        players[position] = {
            id: Date.now().toString() + position,
            name: name,
            characterName: characterName,
            position: position,
            job: job,
            equipmentPolicy: {},
            currentEquipment: {},
            weaponWishes: []
        };
    }
    
    // データベースに保存
    if (database.savePlayersForTier) {
        database.savePlayersForTier(currentRaidTier.id, players);
    }
    
    alert('メンバー設定を保存しました。');
}

// 装備設定表示
function showEquipmentPolicySetup() {
    // ナビゲーションの状態更新
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[1].classList.add('active');
    
    const content = document.getElementById('setup-content');
    
    // メンバーが設定されているかチェック
    if (Object.keys(players).length === 0) {
        content.innerHTML = `
            <div class="section">
                <h2>装備設定</h2>
                <p style="color: #ff6b6b;">先にメンバー設定を完了してください。</p>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="section">
            <h2>装備設定</h2>
            <p>各メンバーの装備方針を設定してください。各部位ごとに零式装備またはトームストーン装備を選択できます。</p>
            <div id="policy-setup">
                ${Object.entries(players).map(([position, player]) => `
                    <div class="player-policy-card">
                        <h3>${position} - ${player.characterName} (${player.job})</h3>
                        <div class="equipment-slots">
                            ${['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'].map(slot => `
                                <div class="slot-policy">
                                    <label>${slot}:</label>
                                    <select id="policy-${position}-${slot}">
                                        <option value="savage">零式装備</option>
                                        <option value="tome">トームストーン装備</option>
                                    </select>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <button onclick="saveEquipmentPolicy()">装備設定を保存</button>
        </div>
    `;
    
    // 装備設定のスタイル追加
    if (!document.getElementById('policy-styles')) {
        const style = document.createElement('style');
        style.id = 'policy-styles';
        style.textContent = `
            .player-policy-card {
                background-color: #16213e;
                padding: 15px;
                margin-bottom: 15px;
                border-radius: 8px;
                border: 1px solid #0f3460;
            }
            .player-policy-card h3 {
                margin: 0 0 15px 0;
                color: #ffd700;
            }
            .equipment-slots {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
            }
            .slot-policy {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
            }
            .slot-policy label {
                margin-bottom: 5px;
                color: #ccc;
                font-weight: bold;
            }
            .slot-policy select {
                width: 100%;
            }
        `;
        document.head.appendChild(style);
    }
}

// 装備設定の保存
function saveEquipmentPolicy() {
    const slots = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];
    
    for (const [position, player] of Object.entries(players)) {
        player.equipmentPolicy = {};
        for (const slot of slots) {
            const selectElement = document.getElementById(`policy-${position}-${slot}`);
            if (selectElement) {
                player.equipmentPolicy[slot] = selectElement.value;
            }
        }
    }
    
    alert('装備設定を保存しました。');
}

// 武器設定表示
function showWeaponWishSetup() {
    // ナビゲーションの状態更新
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[2].classList.add('active');
    
    const content = document.getElementById('setup-content');
    
    // メンバーが設定されているかチェック
    if (Object.keys(players).length === 0) {
        content.innerHTML = `
            <div class="section">
                <h2>4層直ドロップ武器設定</h2>
                <p style="color: #ff6b6b;">先にメンバー設定を完了してください。</p>
            </div>
        `;
        return;
    }
    
    const allJobs = [
        'ナイト', '戦士', '暗黒騎士', 'ガンブレイカー',
        '白魔道士', '占星術士', '学者', '賢者',
        'モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー',
        '吟遊詩人', '機工士', '踊り子', '黒魔道士', '召喚士', '赤魔道士', 'ピクトマンサー'
    ];
    
    content.innerHTML = `
        <div class="section">
            <h2>4層直ドロップ武器設定</h2>
            <p>4層でランダムドロップする武器に対する希望をメンバーごとに設定してください。</p>
            <div id="weapon-wish-setup">
                ${Object.entries(players).map(([position, player]) => `
                    <div class="weapon-wish-card">
                        <h3>${position} - ${player.characterName} (${player.job})</h3>
                        <div class="weapon-wishes">
                            <p>希望武器（複数選択可）：</p>
                            <div class="job-checkboxes">
                                ${allJobs.map(job => `
                                    <label class="job-checkbox">
                                        <input type="checkbox" id="wish-${position}-${job}" value="${job}">
                                        ${job}
                                    </label>
                                `).join('')}
                            </div>
                            <div class="wish-priority">
                                <label for="priority-${position}">優先度:</label>
                                <select id="priority-${position}">
                                    <option value="high">高</option>
                                    <option value="medium" selected>中</option>
                                    <option value="low">低</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button onclick="saveWeaponWishes()">武器設定を保存</button>
        </div>
    `;
    
    // 武器設定のスタイル追加
    if (!document.getElementById('weapon-styles')) {
        const style = document.createElement('style');
        style.id = 'weapon-styles';
        style.textContent = `
            .weapon-wish-card {
                background-color: #16213e;
                padding: 15px;
                margin-bottom: 15px;
                border-radius: 8px;
                border: 1px solid #0f3460;
            }
            .weapon-wish-card h3 {
                margin: 0 0 15px 0;
                color: #ffd700;
            }
            .job-checkboxes {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 10px;
                margin: 10px 0;
            }
            .job-checkbox {
                display: flex;
                align-items: center;
                color: #ccc;
                cursor: pointer;
            }
            .job-checkbox input {
                margin-right: 8px;
            }
            .wish-priority {
                margin-top: 15px;
            }
            .wish-priority label {
                margin-right: 10px;
                color: #ccc;
            }
        `;
        document.head.appendChild(style);
    }
}

// 武器設定の保存
function saveWeaponWishes() {
    for (const [position, player] of Object.entries(players)) {
        player.weaponWishes = [];
        const checkboxes = document.querySelectorAll(`input[id^="wish-${position}-"]:checked`);
        const priority = document.getElementById(`priority-${position}`).value;
        
        checkboxes.forEach(checkbox => {
            player.weaponWishes.push({
                job: checkbox.value,
                priority: priority
            });
        });
    }
    
    alert('武器設定を保存しました。');
}

// 設定完了
function completeSetup() {
    // 設定の完了確認
    if (Object.keys(players).length === 0) {
        alert('メンバー設定を完了してください。');
        return;
    }
    
    // メインダッシュボードに遷移
    showMainDashboard();
}

// メインダッシュボード表示
function showMainDashboard() {
    const app = document.querySelector('.container');
    
    app.innerHTML = `
        <h1>${currentRaidTier.name} - メインダッシュボード</h1>
        
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h3>設定管理</h3>
                <button onclick="showInitialSetup()">設定内容の確認・変更</button>
            </div>
            
            <div class="dashboard-card">
                <h3>装備分配</h3>
                <button onclick="showLayerAllocation(1)">1層クリア</button>
                <button onclick="showLayerAllocation(2)">2層クリア</button>
                <button onclick="showLayerAllocation(3)">3層クリア</button>
                <button onclick="showLayerAllocation(4)">4層クリア</button>
            </div>
            
            <div class="dashboard-card">
                <h3>履歴・統計</h3>
                <button onclick="showHistory()">分配履歴・装備状況</button>
            </div>
        </div>
        
        <div class="dashboard-status">
            <h3>今週の進行状況</h3>
            <div id="weekly-progress">
                <!-- 進行状況表示 -->
                <p>実装予定: 各層のクリア状況と分配履歴を表示</p>
            </div>
        </div>
    `;
    
    // ダッシュボードスタイル追加
    if (!document.getElementById('dashboard-styles')) {
        const style = document.createElement('style');
        style.id = 'dashboard-styles';
        style.textContent = `
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            .dashboard-card {
                background-color: #16213e;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #0f3460;
                text-align: center;
            }
            .dashboard-card h3 {
                color: #ffd700;
                margin-bottom: 15px;
            }
            .dashboard-card button {
                display: block;
                width: 100%;
                margin: 10px 0;
            }
            .dashboard-status {
                margin-top: 30px;
                padding: 20px;
                background-color: #16213e;
                border-radius: 8px;
            }
        `;
        document.head.appendChild(style);
    }
}

// 層別分配画面表示
function showLayerAllocation(layer) {
    if (Object.keys(players).length === 0) {
        alert('先にメンバー設定を完了してください。');
        return;
    }
    
    const app = document.querySelector('.container');
    const layerDrops = getLayerDrops(layer);
    
    app.innerHTML = `
        <h1>${currentRaidTier.name} - ${layer}層装備分配</h1>
        
        <div class="allocation-header">
            <button onclick="showMainDashboard()">メインダッシュボードに戻る</button>
            <div class="layer-info">
                <h2>${layer}層の固定ドロップ装備</h2>
            </div>
        </div>
        
        <div class="equipment-allocation">
            ${layerDrops.map(equipment => `
                <div class="equipment-card">
                    <h3>${equipment.name}</h3>
                    <div class="allocation-results">
                        ${generateAllocationResults(equipment, layer)}
                    </div>
                    <div class="allocation-actions">
                        <select id="final-${equipment.id}">
                            <option value="">分配先を選択</option>
                            ${Object.entries(players).map(([position, player]) => 
                                `<option value="${position}">${position} - ${player.characterName}</option>`
                            ).join('')}
                            <option value="discard">分解・保管</option>
                        </select>
                        <button onclick="confirmAllocation('${equipment.id}', ${layer})">分配確定</button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${layer === 4 ? generateDirectDropWeaponSection() : ''}
        
        <div class="allocation-summary">
            <button onclick="completeLayerAllocation(${layer})">全分配完了</button>
        </div>
    `;
    
    // 分配画面のスタイル追加
    if (!document.getElementById('allocation-styles')) {
        const style = document.createElement('style');
        style.id = 'allocation-styles';
        style.textContent = `
            .allocation-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #0f3460;
            }
            .equipment-allocation {
                display: grid;
                gap: 20px;
                margin-bottom: 30px;
            }
            .equipment-card {
                background-color: #16213e;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #0f3460;
            }
            .equipment-card h3 {
                color: #ffd700;
                margin: 0 0 15px 0;
                text-align: center;
            }
            .allocation-results {
                margin-bottom: 15px;
            }
            .allocation-actions {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            .allocation-actions select {
                flex: 1;
            }
            .need-result, .greed-result, .pass-result {
                padding: 8px 12px;
                margin: 5px;
                border-radius: 5px;
                display: inline-block;
            }
            .need-result {
                background-color: #dc3545;
                color: white;
            }
            .greed-result {
                background-color: #ffc107;
                color: black;
            }
            .pass-result {
                background-color: #6c757d;
                color: white;
            }
            .priority-indicator {
                font-weight: bold;
                margin-left: 5px;
            }
            .direct-weapon-section {
                background-color: #16213e;
                padding: 20px;
                border-radius: 8px;
                border: 2px solid #ffd700;
                margin-bottom: 20px;
            }
            .direct-weapon-section h3 {
                color: #ffd700;
                margin: 0 0 15px 0;
            }
            .weapon-drop-simulator {
                margin-bottom: 15px;
            }
            .weapon-priority-list {
                background-color: #1a1a2e;
                padding: 15px;
                border-radius: 5px;
            }
            .allocation-summary {
                text-align: center;
                margin-top: 30px;
            }
        `;
        document.head.appendChild(style);
    }
}

// 各層のドロップ装備定義
function getLayerDrops(layer) {
    const drops = {
        1: [
            { id: 'ear-1', name: '耳箱', slot: '耳', type: 'accessory' },
            { id: 'neck-1', name: '首箱', slot: '首', type: 'accessory' },
            { id: 'wrist-1', name: '腕箱', slot: '腕', type: 'accessory' },
            { id: 'ring-1', name: '指箱', slot: '指', type: 'accessory' }
        ],
        2: [
            { id: 'head-2', name: '頭箱', slot: '頭', type: 'armor' },
            { id: 'hands-2', name: '手箱', slot: '手', type: 'armor' },
            { id: 'feet-2', name: '足箱', slot: '足', type: 'armor' },
            { id: 'weapon-stone-2', name: '武器石', slot: '武器', type: 'enhancement' },
            { id: 'hardening-2', name: '硬化薬', slot: 'enhancement', type: 'enhancement' }
        ],
        3: [
            { id: 'body-3', name: '胴箱', slot: '胴', type: 'armor' },
            { id: 'legs-3', name: '脚箱', slot: '脚', type: 'armor' },
            { id: 'strengthen-3', name: '強化薬', slot: 'enhancement', type: 'enhancement' },
            { id: 'fiber-3', name: '強化繊維', slot: 'enhancement', type: 'enhancement' }
        ],
        4: [
            { id: 'body-4', name: '胴箱', slot: '胴', type: 'armor' },
            { id: 'weapon-box-4', name: '武器箱', slot: '武器', type: 'weapon' },
            { id: 'mount-4', name: 'マウント', slot: 'mount', type: 'mount' }
        ]
    };
    
    return drops[layer] || [];
}

// Need/Greed/Pass判定結果生成
function generateAllocationResults(equipment, layer) {
    const results = {
        need: [],
        greed: [],
        pass: []
    };
    
    // 装備優先順位定義
    const priorityOrder = {
        'D1': 1, 'D2': 1,  // DPS Melee
        'D3': 2, 'D4': 2,  // DPS Range/Caster
        'MT': 3, 'ST': 3,  // Tank
        'H1': 4, 'H2': 4   // Healer
    };
    
    for (const [position, player] of Object.entries(players)) {
        const policy = player.equipmentPolicy[equipment.slot];
        const priority = priorityOrder[position];
        
        // Need/Greed/Pass判定ロジック
        if (equipment.type === 'mount') {
            // マウントは全員Pass（または特別処理）
            results.pass.push({ position, player, priority });
        } else if (policy === 'savage' && canUseEquipment(player, equipment)) {
            results.need.push({ position, player, priority });
        } else if (policy === 'tome' || !canUseEquipment(player, equipment)) {
            results.pass.push({ position, player, priority });
        } else {
            results.greed.push({ position, player, priority });
        }
    }
    
    // 優先順位でソート
    ['need', 'greed', 'pass'].forEach(type => {
        results[type].sort((a, b) => a.priority - b.priority);
    });
    
    return `
        <div class="allocation-breakdown">
            <div class="need-section">
                <strong>Need (優先取得):</strong>
                ${results.need.map((result, index) => `
                    <span class="need-result">
                        ${index + 1}. ${result.position} - ${result.player.characterName}
                        <span class="priority-indicator">(優先度: ${result.priority})</span>
                    </span>
                `).join('')}
                ${results.need.length === 0 ? '<span class="pass-result">該当者なし</span>' : ''}
            </div>
            <div class="greed-section">
                <strong>Greed (次点):</strong>
                ${results.greed.map(result => `
                    <span class="greed-result">${result.position} - ${result.player.characterName}</span>
                `).join('')}
                ${results.greed.length === 0 ? '<span class="pass-result">該当者なし</span>' : ''}
            </div>
            <div class="pass-section">
                <strong>Pass (不要):</strong>
                ${results.pass.map(result => `
                    <span class="pass-result">${result.position} - ${result.player.characterName}</span>
                `).join('')}
            </div>
        </div>
    `;
}

// 装備使用可能性判定
function canUseEquipment(player, equipment) {
    // 簡易実装: ジョブによる装備制限をチェック
    if (equipment.type === 'mount') return false;
    if (equipment.type === 'enhancement') return true;
    
    // 実際の実装では、より詳細なジョブ別装備制限をチェック
    return true;
}

// 4層直ドロップ武器セクション生成
function generateDirectDropWeaponSection() {
    const allJobs = [
        'ナイト', '戦士', '暗黒騎士', 'ガンブレイカー',
        '白魔道士', '占星術士', '学者', '賢者',
        'モンク', '竜騎士', '忍者', '侍', 'リーパー', 'ヴァイパー',
        '吟遊詩人', '機工士', '踊り子', '黒魔道士', '召喚士', '赤魔道士', 'ピクトマンサー'
    ];
    
    return `
        <div class="direct-weapon-section">
            <h3>4層直ドロップ武器システム</h3>
            <div class="weapon-drop-simulator">
                <label for="dropped-weapon">ドロップした武器:</label>
                <select id="dropped-weapon">
                    <option value="">武器を選択...</option>
                    ${allJobs.map(job => `<option value="${job}">${job}の武器</option>`).join('')}
                </select>
                <button onclick="calculateWeaponPriority()">配布優先順位を計算</button>
            </div>
            <div id="weapon-priority-result">
                <!-- 計算結果がここに表示される -->
            </div>
        </div>
    `;
}

// 武器配布優先順位計算
function calculateWeaponPriority() {
    const droppedWeapon = document.getElementById('dropped-weapon').value;
    if (!droppedWeapon) {
        alert('ドロップした武器を選択してください。');
        return;
    }
    
    const priorityList = [];
    
    // 1. 登録ジョブに該当 & 武器未取得のメンバー
    for (const [position, player] of Object.entries(players)) {
        if (player.job === droppedWeapon) {
            // TODO: 武器取得履歴をチェックして未取得かどうか判定
            priorityList.push({
                position,
                player,
                reason: '登録ジョブ該当・武器未取得',
                priority: 1
            });
        }
    }
    
    // 2. 登録ジョブ以外 & 希望登録済みのメンバー
    for (const [position, player] of Object.entries(players)) {
        if (player.job !== droppedWeapon && 
            player.weaponWishes.some(wish => wish.job === droppedWeapon)) {
            priorityList.push({
                position,
                player,
                reason: '希望登録済み（サブジョブ）',
                priority: 2
            });
        }
    }
    
    // 優先順位でソート
    priorityList.sort((a, b) => a.priority - b.priority);
    
    const resultDiv = document.getElementById('weapon-priority-result');
    resultDiv.innerHTML = `
        <div class="weapon-priority-list">
            <h4>${droppedWeapon}の武器の配布優先順位</h4>
            ${priorityList.length > 0 ? `
                <ol>
                    ${priorityList.map(item => `
                        <li>
                            <strong>${item.position} - ${item.player.characterName}</strong>
                            <br>理由: ${item.reason}
                        </li>
                    `).join('')}
                </ol>
            ` : '<p style="color: #ff6b6b;">該当者なし - 分解または保管</p>'}
            <div class="weapon-allocation-action">
                <select id="weapon-final-allocation">
                    <option value="">分配先を選択</option>
                    ${priorityList.map(item => 
                        `<option value="${item.position}">${item.position} - ${item.player.characterName}</option>`
                    ).join('')}
                    <option value="discard">分解・保管</option>
                </select>
                <button onclick="confirmWeaponAllocation('${droppedWeapon}')">武器分配確定</button>
            </div>
        </div>
    `;
}

// 装備分配確定
function confirmAllocation(equipmentId, layer) {
    const selectedMember = document.getElementById(`final-${equipmentId}`).value;
    if (!selectedMember) {
        alert('分配先を選択してください。');
        return;
    }
    
    // TODO: データベースに分配履歴を保存
    alert(`装備を${selectedMember}に分配しました。`);
}

// 武器分配確定
function confirmWeaponAllocation(weaponJob) {
    const selectedMember = document.getElementById('weapon-final-allocation').value;
    if (!selectedMember) {
        alert('分配先を選択してください。');
        return;
    }
    
    // TODO: データベースに武器分配履歴を保存
    alert(`${weaponJob}の武器を${selectedMember}に分配しました。`);
}

// 層分配完了
function completeLayerAllocation(layer) {
    // TODO: 分配完了処理
    alert(`${layer}層の分配が完了しました。`);
    showMainDashboard();
}

// 履歴表示
function showHistory() {
    // 実装予定
    alert('履歴・統計機能は実装予定です。');
}