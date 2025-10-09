// 分配UI表示モジュール

// allocation-engine.jsから必要な関数をインポート
import { getLayerDrops, calculateAllocation, getPlayerEquipmentStatus, isAllEligiblePlayersObtained } from './allocation-engine.js';

// data-loader.jsからsaveDataToSupabaseをインポート
import { saveDataToSupabase } from './data-loader.js';

// 分配結果表示
function displayAllocationResults(layer, results) {
    const allocationResults = document.getElementById('allocationResults');
    const allocationContent = document.getElementById('allocationContent');

    let html = `
        <div class="allocation-header">
            <h4>${layer}層 装備分配結果</h4>
            <p>推奨分配者が自動計算されました。必要に応じて変更してください。</p>
        </div>
    `;

    // 直ドロップ武器選択（4層のみ）
    if (layer === 4) {
        html += `
            <div class="weapon-selection">
                <h5>直ドロップ武器選択:</h5>
                <select id="directWeaponSelect" onchange="updateDirectWeapon()" style="width: 100%; padding: 5px;">
                    <option value="" ${window.selectedDirectWeapon === '' ? 'selected' : ''}>武器を選択してください</option>
                    <option value="ナイト" ${window.selectedDirectWeapon === 'ナイト' ? 'selected' : ''}>ナイト武器</option>
                    <option value="戦士" ${window.selectedDirectWeapon === '戦士' ? 'selected' : ''}>戦士武器</option>
                    <option value="暗黒騎士" ${window.selectedDirectWeapon === '暗黒騎士' ? 'selected' : ''}>暗黒騎士武器</option>
                    <option value="ガンブレイカー" ${window.selectedDirectWeapon === 'ガンブレイカー' ? 'selected' : ''}>ガンブレイカー武器</option>
                    <option value="白魔道士" ${window.selectedDirectWeapon === '白魔道士' ? 'selected' : ''}>白魔道士武器</option>
                    <option value="学者" ${window.selectedDirectWeapon === '学者' ? 'selected' : ''}>学者武器</option>
                    <option value="占星術士" ${window.selectedDirectWeapon === '占星術士' ? 'selected' : ''}>占星術士武器</option>
                    <option value="賢者" ${window.selectedDirectWeapon === '賢者' ? 'selected' : ''}>賢者武器</option>
                    <option value="モンク" ${window.selectedDirectWeapon === 'モンク' ? 'selected' : ''}>モンク武器</option>
                    <option value="竜騎士" ${window.selectedDirectWeapon === '竜騎士' ? 'selected' : ''}>竜騎士武器</option>
                    <option value="忍者" ${window.selectedDirectWeapon === '忍者' ? 'selected' : ''}>忍者武器</option>
                    <option value="侍" ${window.selectedDirectWeapon === '侍' ? 'selected' : ''}>侍武器</option>
                    <option value="リーパー" ${window.selectedDirectWeapon === 'リーパー' ? 'selected' : ''}>リーパー武器</option>
                    <option value="ヴァイパー" ${window.selectedDirectWeapon === 'ヴァイパー' ? 'selected' : ''}>ヴァイパー武器</option>
                    <option value="黒魔道士" ${window.selectedDirectWeapon === '黒魔道士' ? 'selected' : ''}>黒魔道士武器</option>
                    <option value="召喚士" ${window.selectedDirectWeapon === '召喚士' ? 'selected' : ''}>召喚士武器</option>
                    <option value="赤魔道士" ${window.selectedDirectWeapon === '赤魔道士' ? 'selected' : ''}>赤魔道士武器</option>
                    <option value="ピクトマンサー" ${window.selectedDirectWeapon === 'ピクトマンサー' ? 'selected' : ''}>ピクトマンサー武器</option>
                    <option value="吟遊詩人" ${window.selectedDirectWeapon === '吟遊詩人' ? 'selected' : ''}>吟遊詩人武器</option>
                    <option value="機工士" ${window.selectedDirectWeapon === '機工士' ? 'selected' : ''}>機工士武器</option>
                    <option value="踊り子" ${window.selectedDirectWeapon === '踊り子' ? 'selected' : ''}>踊り子武器</option>
                </select>
            </div>
        `;
    }

    html += `<div class="allocation-grid">`;

    Object.entries(results).forEach(([itemKey, result]) => {
        const drop = result.drop;
        const needCandidates = result.candidates.filter(c => c.type === 'need');
        const greedCandidates = result.candidates.filter(c => c.type === 'greed');
        const passCandidates = result.candidates.filter(c => c.type === 'pass');

        html += `
            <div class="allocation-item">
                <div class="item-header">
                    <h5>${drop.name} ${drop.itemLevel}</h5>
                    <span class="item-type">${getItemTypeLabel(drop.type)}</span>
                </div>

                <div class="predicted-winner">
                    <strong>予測取得者:</strong>
                    ${(() => {
                        if (result.isMultipleRecommended && result.multipleRecommended) {
                            return result.multipleRecommended.map(r =>
                                `${r.player.name} (${r.position}) [${r.player.job}]`
                            ).join('<br>');
                        } else if (result.recommended) {
                            return `${result.recommended.player.name} (${result.recommended.position}) [${result.recommended.player.job}]`;
                        } else {
                            const isFreeLot = isAllEligiblePlayersObtained(drop, result.candidates);
                            return isFreeLot ? 'フリロ' : '該当者なし';
                        }
                    })()}
                </div>

                <div class="allocation-choice">
                    <label>実際の取得者:</label>
                    <select id="allocation-${itemKey}" onchange="updateAllocationChoice('${itemKey}')">
                        <option value="">選択してください</option>
                        ${result.candidates.map(candidate => {
                            // 単一推奨者の場合
                            if (result.recommended?.position === candidate.position) {
                                return `<option value="${candidate.position}" selected>
                                    ${candidate.player.name} (${candidate.position}) [${candidate.player.job}]
                                </option>`;
                            }
                            // 複数推奨者の場合
                            if (result.isMultipleRecommended && result.multipleRecommended?.some(r => r.position === candidate.position)) {
                                return `<option value="${candidate.position}" style="background-color: #fff3cd;">
                                    ${candidate.player.name} (${candidate.position}) [${candidate.player.job}] ★
                                </option>`;
                            }
                            // 通常の候補者
                            return `<option value="${candidate.position}">
                                ${candidate.player.name} (${candidate.position}) [${candidate.player.job}]
                            </option>`;
                        }).join('')}
                    </select>
                </div>

                <div class="judgment-details">
                    <div class="judgment-section">
                        <button class="judgment-toggle" onclick="toggleJudgment('${itemKey}')">
                            判定詳細を表示 ▼
                        </button>
                        <div id="judgment-${itemKey}" class="judgment-content" style="display: none;">
                            ${needCandidates.length > 0 ? `
                                <div class="need-section">
                                    <h6>Need (${needCandidates.length}人)</h6>
                                    ${needCandidates.map(candidate => `
                                        <div class="candidate-item need">
                                            ${candidate.player.name} (${candidate.position}): ${candidate.reason} (${candidate.priority})
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}

                            ${greedCandidates.length > 0 ? `
                                <div class="greed-section">
                                    <h6>Greed (${greedCandidates.length}人)</h6>
                                    ${greedCandidates.map(candidate => `
                                        <div class="candidate-item greed">
                                            ${candidate.player.name} (${candidate.position}): ${candidate.reason} (${candidate.priority})
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}

                            ${passCandidates.length > 0 ? `
                                <div class="pass-section">
                                    <h6>Pass (${passCandidates.length}人)</h6>
                                    ${passCandidates.map(candidate => `
                                        <div class="candidate-item pass">
                                            ${candidate.player.name} (${candidate.position}): ${candidate.reason}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `
        </div>

        <div class="allocation-actions">
            <button onclick="confirmAllocation(${layer})" class="confirm-btn">
                分配を確定
            </button>
            <button onclick="showTierDashboard()" class="cancel-btn">
                キャンセル
            </button>
        </div>
    `;

    allocationContent.innerHTML = html;
    allocationResults.style.display = 'block';

    // 結果表示エリアまでスクロール
    allocationResults.scrollIntoView({ behavior: 'smooth' });
}

// 直ドロップ武器更新
function updateDirectWeapon() {

    const weaponSelect = document.getElementById('directWeaponSelect');
    if (!weaponSelect) {
        console.error('武器選択プルダウンが見つかりません');
        showError('武器選択プルダウンが見つかりません');
        return;
    }

    const selectedWeapon = weaponSelect.value;

    // グローバル変数に選択状態を保存
    window.selectedDirectWeapon = selectedWeapon;

    try {
        // 直ドロップ武器の分配を再計算
        const drops = getLayerDrops(4);

        const allocationResults = calculateAllocation(4, drops);
        displayAllocationResults(4, allocationResults);

        if (selectedWeapon) {
            showSuccess(`${selectedWeapon}を選択しました`);
        } else {
        }
    } catch (error) {
        console.error('武器選択処理エラー:', error);
        showError('武器選択処理でエラーが発生しました: ' + error.message);
    }
}

// 判定詳細の表示切り替え
function toggleJudgment(itemKey) {
    const content = document.getElementById(`judgment-${itemKey}`);
    const button = content.previousElementSibling;

    if (content.style.display === 'none') {
        content.style.display = 'block';
        button.textContent = '判定詳細を隠す ▲';
    } else {
        content.style.display = 'none';
        button.textContent = '判定詳細を表示 ▼';
    }
}

// アイテムタイプラベル
function getItemTypeLabel(type) {
    const labels = {
        'equipment': '装備',
        'material': '強化素材',
        'weapon_box': '武器箱',
        'direct_weapon': '直ドロップ武器'
    };
    return labels[type] || type;
}

// 分配選択更新
function updateAllocationChoice(slot) {
    // 選択変更時の処理（必要に応じて実装）
}

// 分配確定
async function confirmAllocation(layer) {
    try {
        const allocations = [];
        const selects = document.querySelectorAll('[id^="allocation-"]');
        const allocationId = Date.now().toString();

        selects.forEach(select => {
            const itemKey = select.id.replace('allocation-', '');
            const position = select.value;

            if (position && position !== 'discard' && position !== 'フリロ') {
                const player = window.appData.players[window.currentRaidTier.id][position];
                const drops = getLayerDrops(layer);
                const drop = drops.find(d => d.slot === itemKey || d.name.includes(itemKey));

                if (drop && player) {
                    const allocation = {
                        id: `${allocationId}-${itemKey}`,
                        layer: parseInt(layer) || layer,
                        slot: drop.slot,
                        position: position,
                        playerName: player.name,
                        characterName: player.characterName || '',
                        job: player.job,
                        equipment: {
                            name: drop.name,
                            slot: drop.slot,
                            itemLevel: drop.itemLevel
                        },
                        timestamp: new Date().toISOString(),
                        week: getCurrentWeek(),
                        raidTier: window.currentRaidTier.name,
                        // 詳細情報
                        itemType: drop.type,
                        equipmentName: drop.name,
                        equipmentSlot: drop.slot,
                        winner: position,
                        winnerName: player.name
                    };

                    allocations.push(allocation);
                }
            }
        });

        if (allocations.length === 0) {
            showError('分配する装備が選択されていません。');
            return;
        }

        // 分配履歴に記録
        if (!window.appData.allocations[window.currentRaidTier.id]) {
            window.appData.allocations[window.currentRaidTier.id] = [];
        }

        allocations.forEach(allocation => {
            window.appData.allocations[window.currentRaidTier.id].push(allocation);

            // プレイヤーの装備状況更新
            const player = window.appData.players[window.currentRaidTier.id][allocation.position];
            if (player) {
                // 現在装備の更新
                if (!player.currentEquipment) player.currentEquipment = {};
                player.currentEquipment[allocation.slot] = true;

                // 分配履歴の更新
                if (!player.allocationHistory) player.allocationHistory = [];
                player.allocationHistory.push({
                    equipment: allocation.equipment,
                    timestamp: allocation.timestamp,
                    week: allocation.week,
                    layer: allocation.layer
                });

                // 動的優先度更新
                const itemPriority = getItemPriority(allocation.slot);
                player.dynamicPriority = (player.dynamicPriority || 0) + itemPriority;
            }
        });

        // 断章交換者の自動ステータス更新
        await updateTomeExchangeStatus(allocations);

        // Supabaseに保存
        await saveDataToSupabase('allocations', window.appData.allocations[window.currentRaidTier.id]);
        await saveDataToSupabase('players', window.appData.players[window.currentRaidTier.id]);

        showSuccess(`${layer}層の装備分配を確定しました。${allocations.length}件の装備が分配されました。`);
        showEquipmentAllocation(); // 装備分配画面に戻る

    } catch (error) {
        console.error('分配確定エラー:', error);
        showError('分配の確定に失敗しました: ' + error.message);
    }
}

// 現在の週番号取得
function getCurrentWeek() {
    // レイドパッチ開始日を基準に週数を計算
    const patchStartDate = window.currentRaidTier?.startDate;
    if (!patchStartDate) {
        // 開始日が設定されていない場合は1週目とする
        return 1;
    }

    const now = new Date();
    const startDate = new Date(patchStartDate);
    const diffTime = now - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1; // 1週目から開始

    return Math.max(1, weekNumber); // 最低でも1週目
}

// アイテム優先度取得
function getItemPriority(slot) {
    const priorities = {
        '武器': 3,
        '胴': 2,
        '脚': 2,
        '頭': 1,
        '手': 1,
        '足': 1,
        '耳': 1,
        '首': 1,
        '腕': 1,
        '指': 1,
        '武器石': 1,
        '硬化薬': 1,
        '強化薬': 1,
        '強化繊維': 1
    };
    return priorities[slot] || 1;
}

// 断章交換者の自動ステータス更新
async function updateTomeExchangeStatus(allocations) {
    try {
        const currentAllocations = window.appData.allocations[window.currentRaidTier.id] || [];
        let hasUpdates = false;

        // 各装備スロットについて断章交換者をチェック
        const equipmentSlots = ['武器', '頭', '胴', '手', '脚', '足', '耳', '首', '腕', '指'];

        for (const slot of equipmentSlots) {
            // 今回のアロケーションでこのスロットの装備が分配されたかチェック
            const slotAllocations = allocations.filter(alloc => alloc.slot === slot);

            if (slotAllocations.length > 0) {
                // このスロットで断章交換ステータスの人をチェック
                const players = window.appData.players[window.currentRaidTier.id] || {};

                for (const [position, player] of Object.entries(players)) {
                    const currentStatus = getPlayerEquipmentStatus(position, slot);

                    // 断章交換ステータスの人が装備を取得した場合
                    if (currentStatus === '断章交換') {
                        const receivedAllocation = slotAllocations.find(alloc => alloc.position === position);

                        if (receivedAllocation) {
                            // ステータスを「断章交換・箱取得済」に更新
                            const existingAllocation = currentAllocations.find(alloc =>
                                alloc.position === position && alloc.slot === slot
                            );

                            if (existingAllocation) {
                                existingAllocation.status = '断章交換・箱取得済';
                                hasUpdates = true;
                            }
                        }
                    }
                }
            }
        }

        if (hasUpdates) {
            // 更新があった場合は再保存
            await saveDataToSupabase('allocations', window.appData.allocations[window.currentRaidTier.id]);
        }

    } catch (error) {
        console.error('断章交換ステータス更新エラー:', error);
        // エラーが発生しても分配処理自体は続行
    }
}

export {
    displayAllocationResults,
    updateDirectWeapon,
    toggleJudgment,
    getItemTypeLabel,
    updateAllocationChoice,
    confirmAllocation,
    getCurrentWeek,
    getItemPriority,
    updateTomeExchangeStatus
};
