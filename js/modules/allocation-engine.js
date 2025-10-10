// 分配計算エンジンモジュール

// 層別ドロップアイテム定義
function getLayerDrops(layer) {
    const drops = {
        1: [
            { name: '耳装備', slot: '耳', type: 'equipment', itemLevel: '' },
            { name: '首装備', slot: '首', type: 'equipment', itemLevel: '' },
            { name: '腕装備', slot: '腕', type: 'equipment', itemLevel: '' },
            { name: '指装備', slot: '指', type: 'equipment', itemLevel: '' }
        ],
        2: [
            { name: '頭装備', slot: '頭', type: 'equipment', itemLevel: '' },
            { name: '手装備', slot: '手', type: 'equipment', itemLevel: '' },
            { name: '足装備', slot: '足', type: 'equipment', itemLevel: '' },
            { name: '武器石', slot: '武器石', type: 'material', itemLevel: '' },
            { name: '硬化薬', slot: '硬化薬', type: 'material', itemLevel: '' }
        ],
        3: [
            { name: '胴装備', slot: '胴', type: 'equipment', itemLevel: '' },
            { name: '脚装備', slot: '脚', type: 'equipment', itemLevel: '' },
            { name: '強化薬', slot: '強化薬', type: 'material', itemLevel: '' },
            { name: '強化繊維', slot: '強化繊維', type: 'material', itemLevel: '' }
        ],
        4: [
            { name: 'マウント', slot: 'マウント', type: 'mount', itemLevel: '' },
            { name: '武器箱', slot: '武器箱', type: 'weapon_box', itemLevel: '' },
            { name: '直ドロップ武器', slot: '直ドロップ武器', type: 'direct_weapon', itemLevel: '', weapon: window.selectedDirectWeapon || null }
        ]
    };

    return drops[layer] || [];
}

// 分配優先度計算
function calculateAllocation(layer, drops) {
    const players = window.appData.players[window.currentRaidTier.id] || {};
    const results = {};

    drops.forEach(drop => {
        const allCandidates = [];

        Object.entries(players).forEach(([position, player]) => {
            const priority = calculatePlayerPriority(player, drop, position);
            allCandidates.push({
                position,
                player,
                priority: priority.score,
                reason: priority.reason,
                type: priority.type,
                canReceive: priority.canReceive
            });
        });

        // 優先度順でソート（全プレイヤー）
        allCandidates.sort((a, b) => b.priority - a.priority);

        // 取得可能な候補者のみ抽出
        const candidates = allCandidates.filter(c => c.canReceive);

        // 直ドロ武器の特別処理
        if (drop.type === 'direct_weapon' && drop.weapon) {
            // 第一希望者を探す
            const firstChoiceCandidates = candidates.filter(c => {
                const weaponWishes = c.player.weaponWishes || [];
                return weaponWishes[0] === drop.weapon;
            });

            if (firstChoiceCandidates.length > 0) {
                // 第一希望者がいる場合は最優先者のみ
                results[drop.slot] = {
                    drop,
                    candidates: allCandidates,
                    recommended: firstChoiceCandidates[0],
                    isMultipleRecommended: false
                };
            } else {
                // 第一希望者がいない場合、第二希望以降をチェック
                const otherChoiceCandidates = candidates.filter(c => {
                    const weaponWishes = c.player.weaponWishes || [];
                    return weaponWishes.includes(drop.weapon) && weaponWishes[0] !== drop.weapon;
                });

                if (otherChoiceCandidates.length > 1) {
                    // 複数の第二希望以降がある場合
                    results[drop.slot] = {
                        drop,
                        candidates: allCandidates,
                        recommended: null,
                        multipleRecommended: otherChoiceCandidates,
                        isMultipleRecommended: true
                    };
                } else {
                    // 単一の第二希望以降
                    results[drop.slot] = {
                        drop,
                        candidates: allCandidates,
                        recommended: otherChoiceCandidates[0] || null,
                        isMultipleRecommended: false
                    };
                }
            }
        } else {
            // 通常の装備・素材処理
            results[drop.slot] = {
                drop,
                candidates: allCandidates, // 全プレイヤーの判定結果
                recommended: candidates[0] || null, // 最優先の取得可能者
                isMultipleRecommended: false
            };
        }
    });

    return results;
}

// プレイヤー優先度計算
function calculatePlayerPriority(player, drop, position) {
    let score = 0;
    let canReceive = false;
    let reason = 'Pass';
    let type = 'pass';

    if (drop.type === 'equipment') {
        // 装備の場合
        const policy = player.equipmentPolicy?.[drop.slot] || 'トームストーン';

        // 現在の装備状況を取得（分配履歴から）
        const equipmentStatus = getPlayerEquipmentStatus(position, drop.slot);

        // 断章交換者の特別処理
        if (equipmentStatus === '断章交換') {
            // 未取得者がいるかチェック
            const hasUnacquiredRaidPlayer = hasUnacquiredRaidPlayers(drop.slot, position);

            if (hasUnacquiredRaidPlayer) {
                // 未取得者がいる場合は分配対象外
                type = 'pass';
                reason = 'Pass (断章交換 - 他に未取得者あり)';
            } else {
                // 未取得者がいない場合は復活
                canReceive = true;
                type = 'need';
                score = 1000 + getPositionPriority(position) - (player.dynamicPriority || 0);
                reason = 'Need (断章交換 - 復活)';
            }
        } else if (equipmentStatus === '断章交換・箱取得済') {
            // 断章交換・箱取得済は完全に分配対象外
            type = 'pass';
            reason = 'Pass (断章交換・箱取得済)';
        } else if (policy === '零式' && equipmentStatus === '未取得') {
            canReceive = true;
            type = 'need';
            score = 1000 + getPositionPriority(position) - (player.dynamicPriority || 0);
            reason = 'Need (零式)';
        } else if (equipmentStatus === '未取得') {
            canReceive = true;
            type = 'greed';
            score = 500 + getPositionPriority(position) - (player.dynamicPriority || 0);
            reason = 'Greed (トーム可)';
        } else {
            type = 'pass';
            reason = 'Pass (所持済み)';
        }
    } else if (drop.type === 'material') {
        // 強化素材の場合（分配優先度設定に基づく）
        const materialStatus = getPlayerEquipmentStatus(position, drop.slot);

        // 断章交換素材の特別処理
        if (materialStatus === '断章交換') {
            type = 'pass';
            reason = 'Pass (断章交換)';
        } else if (materialStatus === '断章交換・箱取得済') {
            type = 'pass';
            reason = 'Pass (断章交換・箱取得済)';
        } else if (materialStatus === '未取得') {
            canReceive = true;
            type = 'need';
            score = getPositionPriority(position) - (player.dynamicPriority || 0);
            reason = 'Need (素材)';
        } else {
            type = 'pass';
            reason = 'Pass (取得済み)';
        }
    } else if (drop.type === 'weapon_box') {
        // 武器箱の場合（装備方針は「武器」スロットを参照）
        const weaponBoxStatus = getPlayerEquipmentStatus(position, '武器箱');
        const weaponPolicy = player.equipmentPolicy?.['武器'] || 'トームストーン';

        if (weaponBoxStatus === '断章交換') {
            // 武器箱を断章交換している場合の処理
            const hasUnacquiredRaidPlayer = hasUnacquiredWeaponBoxPlayers(position);

            if (hasUnacquiredRaidPlayer) {
                type = 'pass';
                reason = 'Pass (断章交換 - 他に未取得者あり)';
            } else {
                canReceive = true;
                type = 'need';
                score = 2000 + getPositionPriority(position) - (player.dynamicPriority || 0);
                reason = 'Need (断章交換 - 復活)';
            }
        } else if (weaponBoxStatus === '断章交換・箱取得済') {
            type = 'pass';
            reason = 'Pass (断章交換・箱取得済)';
        } else if (weaponBoxStatus === '直ドロ入手') {
            // 直ドロップ武器で取得済みの場合
            const hasUnacquiredDirectWeapon = hasUnacquiredDirectWeaponPlayers(position);

            if (hasUnacquiredDirectWeapon) {
                // 未取得者がいる場合は後回し
                type = 'pass';
                reason = 'Pass (直ドロ入手 - 他に未取得者あり)';
            } else {
                // 全員が武器を取得済みの場合は復活
                if (weaponPolicy === '零式') {
                    canReceive = true;
                    type = 'need';
                    score = 2000 + getPositionPriority(position) - (player.dynamicPriority || 0);
                    reason = 'Need (武器箱 - 復活)';
                } else {
                    canReceive = true;
                    type = 'greed';
                    score = 500 + getPositionPriority(position) - (player.dynamicPriority || 0);
                    reason = 'Greed (武器箱 - トーム可・復活)';
                }
            }
        } else if (weaponBoxStatus === '直ドロ入手・箱取得済') {
            type = 'pass';
            reason = 'Pass (直ドロ入手・箱取得済)';
        } else if (weaponPolicy === '零式' && weaponBoxStatus === '未取得') {
            canReceive = true;
            type = 'need';
            score = 2000 + getPositionPriority(position) - (player.dynamicPriority || 0);
            reason = 'Need (武器箱)';
        } else if (weaponBoxStatus === '未取得') {
            canReceive = true;
            type = 'greed';
            score = 500 + getPositionPriority(position) - (player.dynamicPriority || 0);
            reason = 'Greed (武器箱 - トーム可)';
        } else {
            type = 'pass';
            reason = 'Pass (武器箱取得済み)';
        }
    } else if (drop.type === 'direct_weapon') {
        // 直ドロップ武器の場合（武器希望に基づく）
        const weaponWishes = player.weaponWishes || [];
        const weaponBoxStatus = getPlayerEquipmentStatus(position, '武器箱');
        const weaponType = drop.weapon; // 選択された武器種

        // 武器箱が取得済み系のステータスの場合の処理
        if (weaponBoxStatus === '直ドロ入手' || weaponBoxStatus === '直ドロ入手・箱取得済') {
            // 未取得者がいるかチェック
            const hasUnacquiredDirectWeapon = hasUnacquiredDirectWeaponPlayers(position);

            if (hasUnacquiredDirectWeapon) {
                // 未取得者がいる場合は分配対象外（一時除外）
                type = 'pass';
                reason = 'Pass (直ドロ入手 - 他に未取得者あり)';
            } else {
                // 未取得者がいない場合は復活
                if (weaponType && weaponWishes.includes(weaponType)) {
                    canReceive = true;
                    type = 'need';
                    const wishIndex = weaponWishes.indexOf(weaponType);
                    score = 3000 + getPositionPriority(position) - (wishIndex * 100) - (player.dynamicPriority || 0);
                    reason = `Need (第${wishIndex + 1}希望 - 復活)`;
                } else {
                    type = 'pass';
                    reason = 'Pass (希望なし)';
                }
            }
        } else if (weaponBoxStatus === '取得済') {
            // 武器箱で取得済みの場合は完全に除外
            type = 'pass';
            reason = 'Pass (武器箱取得済)';
        } else if (weaponBoxStatus === '断章交換' || weaponBoxStatus === '断章交換・箱取得済') {
            // 断章交換している場合も除外
            type = 'pass';
            reason = 'Pass (断章交換)';
        } else if (weaponType && weaponWishes.includes(weaponType)) {
            // 希望している武器で未取得の場合
            canReceive = true;
            type = 'need';
            const wishIndex = weaponWishes.indexOf(weaponType);
            score = 3000 + getPositionPriority(position) - (wishIndex * 100) - (player.dynamicPriority || 0);
            reason = `Need (第${wishIndex + 1}希望)`;
        } else {
            // 希望していない武器の場合はPass
            type = 'pass';
            reason = 'Pass (希望なし)';
        }
    } else if (drop.type === 'mount') {
        // マウントの場合（通常装備と同じロジック）
        const policy = player.equipmentPolicy?.[drop.slot] || 'トームストーン';
        const mountStatus = getPlayerEquipmentStatus(position, drop.slot);

        // 断章交換者の特別処理
        if (mountStatus === '断章交換') {
            // 未取得者がいるかチェック
            const hasUnacquiredRaidPlayer = hasUnacquiredRaidPlayers(drop.slot, position);

            if (hasUnacquiredRaidPlayer) {
                // 未取得者がいる場合は分配対象外
                type = 'pass';
                reason = 'Pass (断章交換 - 他に未取得者あり)';
            } else {
                // 未取得者がいない場合は復活
                canReceive = true;
                type = 'need';
                score = 1000 + getPositionPriority(position) - (player.dynamicPriority || 0);
                reason = 'Need (断章交換 - 復活)';
            }
        } else if (mountStatus === '断章交換・箱取得済') {
            // 断章交換・箱取得済は完全に分配対象外
            type = 'pass';
            reason = 'Pass (断章交換・箱取得済)';
        } else if (policy === '零式' && mountStatus === '未取得') {
            canReceive = true;
            type = 'need';
            score = 1000 + getPositionPriority(position) - (player.dynamicPriority || 0);
            reason = 'Need (零式)';
        } else if (mountStatus === '未取得') {
            canReceive = true;
            type = 'greed';
            score = 500 + getPositionPriority(position) - (player.dynamicPriority || 0);
            reason = 'Greed (トーム可)';
        } else {
            type = 'pass';
            reason = 'Pass (所持済み)';
        }
    }

    return { canReceive, score, reason, type };
}

// プレイヤーの装備状況取得
function getPlayerEquipmentStatus(position, slot) {
    const allocations = window.appData.allocations[window.currentRaidTier.id] || [];
    const allocation = allocations.find(alloc =>
        alloc.position === position && alloc.slot === slot
    );

    if (allocation && allocation.status) {
        return allocation.status;
    }

    // 既存のデータでstatusがない場合は「取得済み」とみなす
    if (allocation) {
        return '取得済み';
    }

    return '未取得';
}

// 同じスロットで零式方針の未取得者がいるかチェック
function hasUnacquiredRaidPlayers(slot, excludePosition) {
    const players = window.appData.players[window.currentRaidTier.id] || {};

    for (const [position, player] of Object.entries(players)) {
        if (position === excludePosition) continue;

        const policy = player.equipmentPolicy?.[slot] || 'トームストーン';
        const equipmentStatus = getPlayerEquipmentStatus(position, slot);

        // 零式方針で未取得のプレイヤーがいるか
        if (policy === '零式' && equipmentStatus === '未取得') {
            return true;
        }
    }

    return false;
}

// 武器箱：未取得者がいるかチェック（武器方針で判定）
function hasUnacquiredWeaponBoxPlayers(excludePosition) {
    const players = window.appData.players[window.currentRaidTier.id] || {};

    for (const [position, player] of Object.entries(players)) {
        if (position === excludePosition) continue;

        const weaponPolicy = player.equipmentPolicy?.['武器'] || 'トームストーン';
        const weaponBoxStatus = getPlayerEquipmentStatus(position, '武器箱');

        // 武器を零式方針にしていて武器箱未取得のプレイヤーがいるか
        if (weaponPolicy === '零式' && weaponBoxStatus === '未取得') {
            return true;
        }
    }

    return false;
}

// 直ドロップ武器：武器箱が未取得のプレイヤーがいるかチェック
function hasUnacquiredDirectWeaponPlayers(excludePosition) {
    const players = window.appData.players[window.currentRaidTier.id] || {};

    for (const [position, player] of Object.entries(players)) {
        if (position === excludePosition) continue;

        const weaponBoxStatus = getPlayerEquipmentStatus(position, '武器箱');

        // 武器箱が未取得のプレイヤーがいるか
        if (weaponBoxStatus === '未取得') {
            return true;
        }
    }

    return false;
}

// 分配対象の全員が取得済みまたは断章交換・箱取得済かを判定
function isAllEligiblePlayersObtained(drop, candidates) {
    const players = window.appData.players[window.currentRaidTier.id] || {};

    // 4層直ドロ武器の特別処理
    if (drop.type === 'direct_weapon') {
        const weaponType = drop.weapon;

        // 武器が選択されていない場合はフリロ
        if (!weaponType) {
            return true;
        }

        let hasEligiblePlayer = false;

        for (const [position, player] of Object.entries(players)) {
            const weaponWishes = player.weaponWishes || [];

            // 武器箱の取得状況をチェック
            const weaponBoxStatus = getPlayerEquipmentStatus(position, '武器箱');

            // 武器箱が取得済み系の場合
            if (weaponBoxStatus === '直ドロ入手' || weaponBoxStatus === '直ドロ入手・箱取得済' ||
                weaponBoxStatus === '取得済' || weaponBoxStatus === '断章交換' || weaponBoxStatus === '断章交換・箱取得済') {
                // 未取得者がいるかチェック
                const hasUnacquiredDirectWeapon = hasUnacquiredDirectWeaponPlayers(position);

                if (hasUnacquiredDirectWeapon) {
                    // 未取得者がいる場合は一時除外されるため対象外
                    continue;
                }
                // 未取得者がいない場合は復活するため対象に含める
            }

            // この武器を希望していて武器未取得、または復活対象のプレイヤーがいるかチェック
            if (weaponWishes.includes(weaponType)) {
                hasEligiblePlayer = true;
                break;
            }
        }

        // 希望者がいない、または希望者全員が取得済み = フリロ
        return !hasEligiblePlayer;
    }

    // 通常装備の処理
    for (const [position, player] of Object.entries(players)) {
        const policy = player.equipmentPolicy?.[drop.slot] || 'トームストーン';
        const equipmentStatus = getPlayerEquipmentStatus(position, drop.slot);

        // 零式方針で未取得のプレイヤーがいる場合はフリロ対象外
        if (policy === '零式' && equipmentStatus === '未取得') {
            return false;
        }

        // 断章交換で未取得者がいない場合は復活対象も考慮
        if (equipmentStatus === '断章交換') {
            const hasUnacquiredRaidPlayer = hasUnacquiredRaidPlayers(drop.slot, position);
            if (!hasUnacquiredRaidPlayer) {
                return false; // 断章交換者が復活可能 = フリロ対象外
            }
        }
    }

    // 全員が取得済み、トーム方針、または断章交換・箱取得済 = フリロ
    return true;
}

// ポジション間優先順位取得（装備・素材共通）
function getPositionPriority(position) {
    // 設定された優先順位を取得（デフォルト: D1D2D3D4MTSTH1H2）
    const savedPriority = window.appData.settings?.positionPriority || ['D1', 'D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];
    const positionIndex = savedPriority.indexOf(position);
    return 800 - (positionIndex * 50); // 高い順位ほど高スコア
}

// 強化素材の分配優先度取得（互換性のため残す）
function getMaterialPriority(position, materialType) {
    return getPositionPriority(position);
}

export {
    getLayerDrops,
    calculateAllocation,
    calculatePlayerPriority,
    getPlayerEquipmentStatus,
    hasUnacquiredRaidPlayers,
    hasUnacquiredWeaponBoxPlayers,
    hasUnacquiredDirectWeaponPlayers,
    isAllEligiblePlayersObtained,
    getPositionPriority,
    getMaterialPriority
};
