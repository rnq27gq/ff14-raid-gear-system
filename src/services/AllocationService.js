import { JUDGMENT, EQUIPMENT_POLICY, JOBS, POSITIONS } from '../utils/constants.js';
import { DatabaseService } from './DatabaseService.js';

export class AllocationService {
    constructor() {
        this.db = new DatabaseService();
    }

    /**
     * プレイヤーの装備に対するNeed/Greed/Pass判定を計算
     * 要件定義書基準: Need/Greed/Pass判定基準に基づく
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Object} equipment - 装備オブジェクト
     * @param {Array} currentParty - 現在のパーティメンバー
     * @returns {string} - 'Need', 'Greed', 'Pass'
     */
    calculatePlayerJudgment(player, equipment, currentParty) {
        // 1. 装備方針チェック（要件定義書基準）
        const slotPolicy = player.equipmentPolicy[equipment.slot];
        
        // 装備方針が「トームストーン」で零式装備の場合の判定
        if (slotPolicy === EQUIPMENT_POLICY.TOMESTONE && equipment.source === 'savage') {
            // 将来的に使用可能性がある場合はGreed、そうでなければPass
            if (this.canPlayerUseEquipment(player, equipment)) {
                return JUDGMENT.GREED; // 将来的に使用可能性がある場合
            } else {
                return JUDGMENT.PASS;
            }
        }

        // 2. ジョブ互換性チェック
        if (!this.canPlayerUseEquipment(player, equipment)) {
            return JUDGMENT.PASS;
        }

        // 3. Need判定: その装備が現在の装備より上位で、かつ装備方針が「零式」の場合
        if (slotPolicy === EQUIPMENT_POLICY.SAVAGE && this.isEquipmentUpgrade(player, equipment)) {
            return JUDGMENT.NEED;
        }

        // 4. 既により良い装備を持っている場合はPass
        if (!this.isEquipmentUpgrade(player, equipment)) {
            return JUDGMENT.PASS;
        }

        // 5. その他の場合はGreed
        return JUDGMENT.GREED;
    }

    /**
     * プレイヤーがその装備を使用できるかチェック
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Object} equipment - 装備オブジェクト
     * @returns {boolean}
     */
    canPlayerUseEquipment(player, equipment) {
        // 装備に互換性ジョブリストがあればそれを使用、なければ全ジョブ使用可能とする
        if (equipment.compatibleJobs && equipment.compatibleJobs.length > 0) {
            return equipment.compatibleJobs.includes(player.job);
        }
        // 互換性リストがない場合は全ジョブ使用可能（アクセサリなど）
        return true;
    }

    /**
     * 装備がアップグレードかどうかをチェック
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Object} equipment - 装備オブジェクト
     * @returns {boolean}
     */
    isEquipmentUpgrade(player, equipment) {
        const currentEquipment = player.currentEquipment[equipment.slot];
        
        // 現在装備がない場合はアップグレード
        if (!currentEquipment) {
            return true;
        }

        // アイテムレベル比較
        return equipment.itemLevel > (currentEquipment.itemLevel || 0);
    }

    /**
     * 全プレイヤーの判定を処理して分配結果を決定
     * @param {Object} equipment - 装備オブジェクト
     * @param {Array} playerJudgments - プレイヤー判定リスト [{player, judgment}]
     * @returns {Object} - 分配結果 {winner, reason, allJudgments}
     */
    processAllocationVoting(equipment, playerJudgments) {
        const needPlayers = playerJudgments.filter(pj => pj.judgment === JUDGMENT.NEED);
        const greedPlayers = playerJudgments.filter(pj => pj.judgment === JUDGMENT.GREED);
        const passPlayers = playerJudgments.filter(pj => pj.judgment === JUDGMENT.PASS);

        let winner = null;
        let reason = '';

        if (needPlayers.length > 0) {
            // Need者がいる場合、Need者の中から選択
            if (needPlayers.length === 1) {
                winner = needPlayers[0].player;
                reason = 'Need（単独）';
            } else {
                // 複数Need者の場合、要件定義書に基づく優先度で判定
                winner = this.determineWinnerFromNeedPlayers(needPlayers, equipment);
                reason = 'Need（優先度判定）';
            }
        } else if (greedPlayers.length > 0) {
            // Greed者のみの場合
            if (greedPlayers.length === 1) {
                winner = greedPlayers[0].player;
                reason = 'Greed（単独）';
            } else {
                // 複数Greed者の場合、優先度で判定
                winner = this.determineWinnerFromGreedPlayers(greedPlayers, equipment);
                reason = 'Greed（優先度判定）';
            }
        } else {
            // 全員Pass
            reason = '全員Pass（分解）';
        }

        return {
            winner: winner,
            reason: reason,
            allJudgments: playerJudgments,
            needCount: needPlayers.length,
            greedCount: greedPlayers.length,
            passCount: passPlayers.length
        };
    }

    /**
     * Need者の中から要件定義書に基づく優先度で勝者を決定
     * 優先度: DPS Melee (D1/D2) > DPS その他 (D3/D4) > Tank (MT/ST) > Healer (H1/H2)
     * @param {Array} needPlayers - Need判定したプレイヤーリスト
     * @param {Object} equipment - 装備オブジェクト
     * @returns {Object} - 勝者プレイヤー
     */
    determineWinnerFromNeedPlayers(needPlayers, equipment) {
        // 1. 要件定義書に基づく優先度でソート
        const sortedByPriority = needPlayers.sort((a, b) => {
            const priorityA = this.getPositionPriority(a.player.position);
            const priorityB = this.getPositionPriority(b.player.position);
            return priorityA - priorityB;
        });

        const topPriority = this.getPositionPriority(sortedByPriority[0].player.position);
        const topPriorityPlayers = sortedByPriority.filter(p => 
            this.getPositionPriority(p.player.position) === topPriority
        );

        if (topPriorityPlayers.length === 1) {
            return topPriorityPlayers[0].player;
        }

        // 2. 同優先度の場合、アップグレード幅で判定
        const sortedByUpgrade = topPriorityPlayers.sort((a, b) => {
            const upgradeA = this.calculateUpgradeValue(a.player, equipment);
            const upgradeB = this.calculateUpgradeValue(b.player, equipment);
            return upgradeB - upgradeA; // 降順（アップグレード幅が大きい順）
        });

        return sortedByUpgrade[0].player;
    }

    /**
     * Greed者の中から優先度で勝者を決定
     * @param {Array} greedPlayers - Greed判定したプレイヤーリスト
     * @param {Object} equipment - 装備オブジェクト
     * @returns {Object} - 勝者プレイヤー
     */
    determineWinnerFromGreedPlayers(greedPlayers, equipment) {
        // Greedの場合も優先度を適用
        const sortedByPriority = greedPlayers.sort((a, b) => {
            const priorityA = this.getPositionPriority(a.player.position);
            const priorityB = this.getPositionPriority(b.player.position);
            return priorityA - priorityB;
        });

        const topPriority = this.getPositionPriority(sortedByPriority[0].player.position);
        const topPriorityPlayers = sortedByPriority.filter(p => 
            this.getPositionPriority(p.player.position) === topPriority
        );

        if (topPriorityPlayers.length === 1) {
            return topPriorityPlayers[0].player;
        }

        // 同優先度の場合はランダム
        const randomIndex = Math.floor(Math.random() * topPriorityPlayers.length);
        return topPriorityPlayers[randomIndex].player;
    }

    /**
     * 要件定義書に基づくポジション優先度を取得
     * DPS Melee > DPS その他 > Tank > Healer
     * @param {string} position - ポジション (MT/ST/H1/H2/D1/D2/D3/D4)
     * @returns {number} - 優先度（数値が小さいほど高優先度）
     */
    getPositionPriority(position) {
        const positionPriorities = {
            'D1': 1, // DPS Melee
            'D2': 1, // DPS Melee  
            'D3': 2, // DPS Range/Caster
            'D4': 2, // DPS Range/Caster
            'MT': 3, // Tank
            'ST': 3, // Tank
            'H1': 4, // Healer
            'H2': 4  // Healer
        };

        return positionPriorities[position] || 999;
    }

    /**
     * アップグレード価値を計算
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Object} equipment - 装備オブジェクト
     * @returns {number} - アップグレード価値
     */
    calculateUpgradeValue(player, equipment) {
        const currentEquipment = player.currentEquipment[equipment.slot];
        if (!currentEquipment) return equipment.itemLevel;
        
        return equipment.itemLevel - (currentEquipment.itemLevel || 0);
    }

    /**
     * 4層直ドロップ武器の配布優先順位を決定
     * 要件定義書基準:
     * 1. 登録ジョブに該当 & 武器未取得
     * 2. 登録ジョブ以外 & 希望登録済み
     * 3. 該当者なし（分解・保管）
     * @param {string} droppedWeaponJob - ドロップした武器のジョブ
     * @param {Array} players - 全プレイヤーリスト
     * @returns {Object} - 配布結果 {winner, reason, eligiblePlayers}
     */
    processDirectDropWeapon(droppedWeaponJob, players) {
        // 1. 登録ジョブに該当 & 武器未取得のプレイヤーを検索
        const primaryCandidates = players.filter(player => {
            const hasWeaponWish = player.weaponWishes.some(wish => wish.jobName === droppedWeaponJob);
            const hasWeapon = this.playerHasWeaponForJob(player, droppedWeaponJob);
            return hasWeaponWish && !hasWeapon;
        });

        if (primaryCandidates.length > 0) {
            // 同条件の場合は優先度順に決定
            const winner = this.selectByPriority(primaryCandidates);
            return {
                winner: winner,
                reason: '登録ジョブ該当・武器未取得',
                eligiblePlayers: primaryCandidates
            };
        }

        // 2. 登録ジョブ以外 & 希望登録済みのプレイヤーを検索
        const secondaryCandidates = players.filter(player => {
            return player.weaponWishes.some(wish => wish.jobName === droppedWeaponJob);
        });

        if (secondaryCandidates.length > 0) {
            const winner = this.selectByPriority(secondaryCandidates);
            return {
                winner: winner,
                reason: '希望登録済み',
                eligiblePlayers: secondaryCandidates
            };
        }

        // 3. 該当者なし
        return {
            winner: null,
            reason: '該当者なし（分解・保管）',
            eligiblePlayers: []
        };
    }

    /**
     * プレイヤーが特定ジョブの武器を持っているかチェック
     * @param {Object} player - プレイヤーオブジェクト
     * @param {string} jobName - ジョブ名
     * @returns {boolean}
     */
    playerHasWeaponForJob(player, jobName) {
        // 実装: 武器取得履歴をチェック
        // 現在の実装では簡易的に現在装備の武器のみチェック
        const currentWeapon = player.currentEquipment['武器'];
        if (!currentWeapon) return false;
        
        return currentWeapon.compatibleJobs && currentWeapon.compatibleJobs.includes(jobName);
    }

    /**
     * 優先度に基づいてプレイヤーを選択
     * @param {Array} candidates - 候補プレイヤーリスト
     * @returns {Object} - 選択されたプレイヤー
     */
    selectByPriority(candidates) {
        if (candidates.length === 1) {
            return candidates[0];
        }

        // 優先度でソート
        const sortedCandidates = candidates.sort((a, b) => {
            return this.getPositionPriority(a.position) - this.getPositionPriority(b.position);
        });

        return sortedCandidates[0];
    }

    /**
     * 分配結果からAllocationオブジェクトを作成
     * @param {Object} allocationResult - processAllocationVotingの結果
     * @param {Object} equipment - 装備オブジェクト
     * @param {string} raidTierId - レイドティアID
     * @param {number} layer - 層番号
     * @returns {Object} - Allocationオブジェクト
     */
    createAllocationFromResult(allocationResult, equipment, raidTierId, layer) {
        const allocation = {
            id: Date.now().toString(),
            raidTierId: raidTierId,
            layer: layer,
            equipment: equipment,
            winner: allocationResult.winner,
            judgmentType: allocationResult.winner ? 
                (allocationResult.needCount > 0 ? JUDGMENT.NEED : JUDGMENT.GREED) : null,
            reason: allocationResult.reason,
            allJudgments: allocationResult.allJudgments,
            timestamp: new Date().toISOString(),
            week: this.getCurrentWeek()
        };

        return allocation;
    }

    /**
     * 現在の週を取得（火曜17:00 JSTリセット考慮）
     * @returns {string} - 週識別子
     */
    getCurrentWeek() {
        const now = new Date();
        // 火曜日17:00リセットを考慮した週計算
        const resetTime = new Date(now);
        resetTime.setHours(17, 0, 0, 0);
        
        // 現在時刻が火曜日17:00より前の場合、前週とする
        if (now.getDay() < 2 || (now.getDay() === 2 && now.getHours() < 17)) {
            resetTime.setDate(resetTime.getDate() - 7);
        }
        
        // 最も近い火曜日を基準とした週識別子
        const weekStart = new Date(resetTime);
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() - 2));
        
        return weekStart.toISOString().split('T')[0];
    }

    /**
     * 層クリア時の装備分配処理
     * @param {string} raidTierId - レイドティアID
     * @param {number} layer - 層番号
     * @param {Array} droppedEquipment - ドロップ装備リスト
     * @param {Array} players - 参加プレイヤーリスト
     * @returns {Array} - 分配結果リスト
     */
    async processLayerClearing(raidTierId, layer, droppedEquipment, players) {
        const results = [];

        for (const equipment of droppedEquipment) {
            // 4層直ドロップ武器の特別処理
            if (layer === 4 && equipment.slot === '武器' && equipment.type === 'direct') {
                const weaponResult = this.processDirectDropWeapon(equipment.jobName, players);
                const allocation = this.createAllocationFromResult(weaponResult, equipment, raidTierId, layer);
                results.push(allocation);
                continue;
            }

            // 通常の装備分配処理
            const playerJudgments = players.map(player => ({
                player: player,
                judgment: this.calculatePlayerJudgment(player, equipment, players)
            }));

            const allocationResult = this.processAllocationVoting(equipment, playerJudgments);
            const allocation = this.createAllocationFromResult(allocationResult, equipment, raidTierId, layer);
            
            // データベースに保存
            await this.db.saveAllocation(allocation);
            
            // 勝者の装備を更新
            if (allocation.winner) {
                allocation.winner.currentEquipment[equipment.slot] = equipment;
                await this.db.updatePlayer(raidTierId, allocation.winner);
            }

            results.push(allocation);
        }

        return results;
    }
}